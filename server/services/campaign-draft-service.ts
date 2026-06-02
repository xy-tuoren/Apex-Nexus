import type { CampaignDraft } from "@/lib/types";
import type { CampaignDraftInput } from "@/lib/schemas/campaign";
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
import { validateCampaignDraft } from "@/server/services/validation-service";
import { buildDemandGenMutateOperations, buildPMaxMutateOperations } from "@/server/google-ads/mutate-builder";

export async function createCampaignDraft(input: CampaignDraftInput) {
  const now = timestamp();
  const draft: CampaignDraft = {
    id: newId("draft"),
    ...input,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  };

  await insertOne("campaign_drafts", draft);
  await audit("campaign_draft.create", draft.id, {
    adAccountId: draft.adAccountId,
    advertisingType: draft.advertisingType,
  });

  return draft;
}

export async function listCampaignDrafts() {
  return listCollection("campaign_drafts");
}

export async function getCampaignDraft(id: string) {
  return findById("campaign_drafts", id);
}

export async function validateAndMarkDraft(id: string) {
  const draft = await getCampaignDraft(id);
  if (!draft) {
    return null;
  }

  const result = await validateCampaignDraft(draft);

  if (result.valid) {
    await updateById("campaign_drafts", id, {
      status: "VALIDATED",
      updatedAt: timestamp(),
    });
  }

  return result;
}

export async function buildDraftPreview(id: string) {
  const draft = await getCampaignDraft(id);
  if (!draft) {
    return null;
  }

  const adAccount = await findById("google_ad_accounts", draft.adAccountId);

  if (!adAccount) {
    return {
      draft,
      mutateOperations: [],
      headers: {},
      warnings: ["投放账号不存在，无法生成完整预览。"],
    };
  }

  const mutateOperations =
    draft.advertisingType === "PERFORMANCE_MAX"
      ? buildPMaxMutateOperations(draft, adAccount)
      : buildDemandGenMutateOperations(draft, adAccount);

  const loginCustomerId = await getLoginCustomerIdForAdAccount(adAccount.id);

  return {
    draft,
    mutateOperations,
    headers: {
      "login-customer-id": loginCustomerId ?? adAccount.customerId,
      "developer-token": "{stored-developer-token}",
      Authorization: "Bearer {runtime-access-token}",
    },
    warnings: [],
  };
}
