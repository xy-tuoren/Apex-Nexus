import type { GoogleCampaignBinding, LaunchJob } from "@/lib/types";
import { mutateGoogleAds } from "@/server/google-ads/client";
import { toGoogleAdsError } from "@/server/google-ads/errors";
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
import { validateLaunchEligibility } from "@/server/services/validation-service";

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
    const googleAdsResponse = await mutateGoogleAds({
      customerId: adAccount.customerId,
      loginCustomerId: loginCustomerId ?? adAccount.customerId,
      mutateOperations: preview.mutateOperations,
    });

    const binding: GoogleCampaignBinding = {
      id: newId("binding"),
      draftId: draft.id,
      adAccountId: draft.adAccountId,
      advertisingType: draft.advertisingType,
      campaignResourceName: `customers/${adAccount.customerId}/campaigns/dry-run-or-created`,
      budgetResourceName: `customers/${adAccount.customerId}/campaignBudgets/dry-run-or-created`,
      assetGroupResourceName:
        draft.advertisingType === "PERFORMANCE_MAX"
          ? `customers/${adAccount.customerId}/assetGroups/dry-run-or-created`
          : undefined,
      adGroupResourceName:
        draft.advertisingType === "DEMAND_GEN"
          ? `customers/${adAccount.customerId}/adGroups/dry-run-or-created`
          : undefined,
      adGroupAdResourceName:
        draft.advertisingType === "DEMAND_GEN"
          ? `customers/${adAccount.customerId}/adGroupAds/dry-run-or-created`
          : undefined,
      assetResourceNames: [],
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
      googleAdsRequest: preview.mutateOperations,
      googleAdsResponse,
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
