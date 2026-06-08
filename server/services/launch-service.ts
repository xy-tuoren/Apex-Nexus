import type { ApiError, GoogleCampaignBinding, LaunchBatch, LaunchJob } from "@/lib/types";
import type { CampaignDraftInput, LaunchBatchCreateInput } from "@/lib/schemas/campaign";
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
import { createCampaignDraft } from "@/server/services/campaign-draft-service";
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
  const job = await createQueuedLaunchJob(draftId, idempotencyKey);
  if (job.status !== "QUEUED") {
    return job;
  }
  return runLaunchJob(job.id);
}

export async function createQueuedLaunchJob(draftId: string, idempotencyKey: string) {
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

  return job;
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

function summarizeBatchStatus(items: LaunchBatch["items"]): LaunchBatch["status"] {
  if (items.some((item) => item.status === "RUNNING")) {
    return "RUNNING";
  }
  if (items.some((item) => item.status === "QUEUED")) {
    return "QUEUED";
  }
  const succeeded = items.filter((item) => item.status === "SUCCEEDED").length;
  const failed = items.filter((item) => item.status === "FAILED").length;
  if (succeeded > 0 && failed > 0) {
    return "PARTIAL_FAILED";
  }
  if (failed > 0) {
    return "FAILED";
  }
  return "SUCCEEDED";
}

async function updateLaunchBatchItems(
  batchId: string,
  patchItems: (items: LaunchBatch["items"]) => LaunchBatch["items"],
) {
  const batch = await findById("launch_batches", batchId);
  if (!batch) {
    return null;
  }
  const items = patchItems(batch.items);
  return updateById("launch_batches", batchId, {
    items,
    status: summarizeBatchStatus(items),
    updatedAt: timestamp(),
  });
}

async function runWithResourceLocks<T>(
  items: T[],
  getLockKeys: (item: T) => Promise<string[]>,
  run: (item: T) => Promise<unknown>,
) {
  const tails = new Map<string, Promise<void>>();

  await Promise.allSettled(
    items.map(async (item) => {
      const lockKeys = (await getLockKeys(item)).toSorted();
      let previous = Promise.resolve();

      for (const lockKey of lockKeys) {
        previous = Promise.allSettled([previous, tails.get(lockKey) ?? Promise.resolve()]).then(
          () => undefined,
        );
      }

      const current = previous.then(() => run(item)).then(() => undefined);

      for (const lockKey of lockKeys) {
        tails.set(lockKey, current);
      }

      await current;
    }),
  );
}

async function launchBatchItemSharedResourceKeys(item: LaunchBatch["items"][number]) {
  const [draft, adAccount] = await Promise.all([
    findById("campaign_drafts", item.draftId),
    findById("google_ad_accounts", item.adAccountId),
  ]);

  if (!draft || !adAccount) {
    return [];
  }

  const customerId = adAccount.customerId.replaceAll("-", "");
  const keys: string[] = [];

  if (
    draft.campaignObjective === "CONVERSIONS" &&
    draft.conversionGoal
  ) {
    keys.push(`customer:${customerId}:conversion-goal:${draft.conversionGoal}`);
  }

  return keys;
}

export async function createLaunchBatch(input: LaunchBatchCreateInput) {
  const items: LaunchBatch["items"] = [];
  const now = timestamp();

  for (const campaign of input.campaigns) {
    const draft = await createCampaignDraft(campaign.payload as CampaignDraftInput);
    const job = await createQueuedLaunchJob(
      draft.id,
      `launch:${draft.id}:${Date.now()}`,
    );
    items.push({
      id: newId("batch_item"),
      clientCampaignId: campaign.clientCampaignId,
      campaignName: campaign.campaignName,
      adAccountId: campaign.payload.adAccountId,
      draftId: draft.id,
      jobId: job.id,
      status: job.status,
      submittedAt: now,
      updatedAt: now,
    });
  }

  const batch: LaunchBatch = {
    id: newId("batch"),
    status: "QUEUED",
    items,
    createdAt: now,
    updatedAt: now,
  };

  await insertOne("launch_batches", batch);
  await audit("launch_batch.create", batch.id, {
    count: items.length,
  });

  return batch;
}

export async function runLaunchBatch(batchId: string) {
  const batch = await findById("launch_batches", batchId);
  if (!batch) {
    return null;
  }

  const runningAt = timestamp();
  await updateById("launch_batches", batchId, {
    status: "RUNNING",
    items: batch.items.map((item) => ({
      ...item,
      status: "RUNNING" as const,
      updatedAt: runningAt,
    })),
    updatedAt: runningAt,
  });

  await runWithResourceLocks(
    batch.items,
    launchBatchItemSharedResourceKeys,
    (item) => runLaunchJob(item.jobId),
  );

  const jobs = await listCollection("launch_jobs");
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const updatedAt = timestamp();

  return updateLaunchBatchItems(batchId, (items) =>
    items.map((item) => {
      const job = jobsById.get(item.jobId);
      return {
        ...item,
        status: job?.status ?? "FAILED",
        error: job?.error as ApiError | undefined,
        result: job?.result,
        updatedAt,
      };
    }),
  );
}

export async function getLaunchBatch(id: string) {
  return findById("launch_batches", id);
}

export async function listLaunchBatches() {
  const batches = await listCollection("launch_batches");
  return batches.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
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
