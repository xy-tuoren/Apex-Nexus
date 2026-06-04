import type { GoogleCampaignBinding, LaunchJob } from "@/lib/types";
import { mutateGoogleAds } from "@/server/google-ads/client";
import { toGoogleAdsError } from "@/server/google-ads/errors";
import { buildCampaignConversionGoalMutateOperations } from "@/server/google-ads/mutate-builder";
import {
  audit,
  findById,
  insertOne,
  listCollection,
  newId,
  timestamp,
  updateById,
} from "@/server/repositories/data-store";
import { getLoginCustomerIdForAdAccount } from "@/server/services/account-service";
import { buildDraftPreview } from "@/server/services/campaign-draft-service";
import { listCampaignConversionGoalPoints } from "@/server/services/conversion-goal-service";
import { validateLaunchEligibility } from "@/server/services/validation-service";

type MutateOperationResponse = Record<string, { resourceName?: string } | undefined>;

function resourceNameFromMutateResponse(
  googleAdsResponse: unknown,
  responseKey: string,
) {
  const responses =
    googleAdsResponse &&
    typeof googleAdsResponse === "object" &&
    "mutateOperationResponses" in googleAdsResponse
      ? (googleAdsResponse as { mutateOperationResponses?: MutateOperationResponse[] })
          .mutateOperationResponses
      : undefined;

  return responses?.find((response) => response[responseKey]?.resourceName)?.[responseKey]
    ?.resourceName;
}

function resourceNamesFromMutateResponse(
  googleAdsResponse: unknown,
  responseKey: string,
) {
  const responses =
    googleAdsResponse &&
    typeof googleAdsResponse === "object" &&
    "mutateOperationResponses" in googleAdsResponse
      ? (googleAdsResponse as { mutateOperationResponses?: MutateOperationResponse[] })
          .mutateOperationResponses
      : undefined;

  return (
    responses
      ?.map((response) => response[responseKey]?.resourceName)
      .filter((resourceName): resourceName is string => Boolean(resourceName)) ?? []
  );
}

export async function createLaunchJob(draftId: string, idempotencyKey: string) {
  const existingJobs = await listCollection("launch_jobs");
  const existing = existingJobs.find((job) => job.idempotencyKey === idempotencyKey);
  if (existing) {
    return existing;
  }

  const validation = await validateLaunchEligibility(draftId);
  if (!validation.valid || !validation.draft) {
    throw new Error(JSON.stringify(validation.errors));
  }

  const job: LaunchJob = {
    id: newId("job"),
    draftId,
    idempotencyKey,
    status: "QUEUED",
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };

  await insertOne("launch_jobs", job);
  await audit("launch_job.create", job.id, { draftId, idempotencyKey });

  return runLaunchJob(job.id);
}

export async function runLaunchJob(jobId: string) {
  const job = await findById("launch_jobs", jobId);
  if (!job) {
    return null;
  }
  let googleAdsRequest: unknown;

  await updateById("launch_jobs", job.id, {
    status: "RUNNING",
    updatedAt: timestamp(),
  });

  try {
    const [draft, preview] = await Promise.all([
      findById("campaign_drafts", job.draftId),
      buildDraftPreview(job.draftId),
    ]);

    if (!draft || !preview) {
      throw new Error("Draft not found");
    }

    const adAccount = await findById("google_ad_accounts", draft.adAccountId);

    if (!adAccount) {
      throw new Error("Ad account not found");
    }

    const loginCustomerId = await getLoginCustomerIdForAdAccount(adAccount.id);
    const createMutateOperations = preview.mutateOperations;
    googleAdsRequest = createMutateOperations;
    const createGoogleAdsResponse = await mutateGoogleAds({
      customerId: adAccount.customerId,
      loginCustomerId: loginCustomerId ?? adAccount.customerId,
      mutateOperations: createMutateOperations,
    });
    const campaignResourceName =
      resourceNameFromMutateResponse(createGoogleAdsResponse, "campaignResult") ??
      `customers/${adAccount.customerId}/campaigns/dry-run-or-created`;

    const shouldLoadConversionGoals =
      process.env.GOOGLE_ADS_DRY_RUN === "false" &&
      draft.campaignObjective === "CONVERSIONS" &&
      Boolean(draft.conversionGoal);
    const conversionGoals = shouldLoadConversionGoals
      ? await listCampaignConversionGoalPoints({
        adAccountId: adAccount.id,
        customerId: adAccount.customerId,
        loginCustomerId: loginCustomerId ?? adAccount.customerId,
        campaignResourceName,
      }).catch(() => [])
      : [];
    const conversionGoalMutateOperations = buildCampaignConversionGoalMutateOperations({
      draft,
      conversionGoals,
    });
    let conversionGoalGoogleAdsResponse: unknown = null;
    let conversionGoalGoogleAdsError: unknown = null;
    if (conversionGoalMutateOperations.length > 0) {
      try {
        conversionGoalGoogleAdsResponse = await mutateGoogleAds({
          customerId: adAccount.customerId,
          loginCustomerId: loginCustomerId ?? adAccount.customerId,
          mutateOperations: conversionGoalMutateOperations,
        });
      } catch (error) {
        conversionGoalGoogleAdsError = toGoogleAdsError(error);
        await audit("campaign_conversion_goals.update_failed", job.id, {
          draftId: draft.id,
          campaignResourceName,
          error: conversionGoalGoogleAdsError,
        });
      }
    }

    googleAdsRequest = {
      createMutateOperations,
      conversionGoalMutateOperations,
    };

    const binding: GoogleCampaignBinding = {
      id: newId("binding"),
      draftId: draft.id,
      adAccountId: draft.adAccountId,
      advertisingType: draft.advertisingType,
      campaignResourceName,
      budgetResourceName:
        resourceNameFromMutateResponse(createGoogleAdsResponse, "campaignBudgetResult") ??
        `customers/${adAccount.customerId}/campaignBudgets/dry-run-or-created`,
      adGroupResourceName:
        resourceNameFromMutateResponse(createGoogleAdsResponse, "adGroupResult") ??
        `customers/${adAccount.customerId}/adGroups/dry-run-or-created`,
      adGroupAdResourceName:
        resourceNameFromMutateResponse(createGoogleAdsResponse, "adGroupAdResult") ??
        `customers/${adAccount.customerId}/adGroupAds/dry-run-or-created`,
      assetResourceNames: resourceNamesFromMutateResponse(createGoogleAdsResponse, "assetResult"),
      status: "PAUSED",
      createdAt: timestamp(),
    };

    await insertOne("google_campaign_bindings", binding);
    await updateById("campaign_drafts", draft.id, {
      status: "SUBMITTED",
      updatedAt: timestamp(),
    });
    const updatedJob = await updateById("launch_jobs", job.id, {
      status: "SUCCEEDED",
      result: binding,
      googleAdsRequest,
      googleAdsResponse: {
        create: createGoogleAdsResponse,
        conversionGoals: conversionGoalGoogleAdsResponse,
        conversionGoalError: conversionGoalGoogleAdsError,
      },
      updatedAt: timestamp(),
    });

    await audit("launch_job.succeeded", job.id, {
      draftId: draft.id,
      bindingId: binding.id,
    });

    return updatedJob;
  } catch (error) {
    const googleAdsError = toGoogleAdsError(error);
    const updatedJob = await updateById("launch_jobs", job.id, {
      status: "FAILED",
      error: googleAdsError,
      googleAdsRequest,
      updatedAt: timestamp(),
    });

    await audit("launch_job.failed", job.id, googleAdsError);

    return updatedJob;
  }
}

export async function getLaunchJob(id: string) {
  return findById("launch_jobs", id);
}

export async function listLaunchJobs() {
  return listCollection("launch_jobs");
}

export async function updateCampaignStatus(id: string, status: "ENABLED" | "PAUSED") {
  const binding = await updateById("google_campaign_bindings", id, {
    status,
  });
  await audit(`campaign.${status.toLowerCase()}`, id);
  return binding;
}

export async function updateCampaignBudget(id: string, budgetMicros: number) {
  const binding = await findById("google_campaign_bindings", id);
  if (!binding) {
    return null;
  }

  await audit("campaign.budget.update", id, { budgetMicros });
  return {
    binding,
    budgetMicros,
    status: "QUEUED_FOR_GOOGLE_ADS_UPDATE",
  };
}

export async function getCampaignMetrics(id: string) {
  const metrics = await listCollection("campaign_metrics_daily");
  return metrics.filter((row) => row.campaignBindingId === id);
}
