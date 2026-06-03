import { fail, ok, parseError } from "@/lib/api-response";
import { campaignDraftSchema } from "@/lib/schemas/campaign";
import type { CampaignDraft } from "@/lib/types";
import {
  createCampaignDraft,
  listCampaignDrafts,
} from "@/server/services/campaign-draft-service";

function compactDraft(draft: CampaignDraft) {
  return {
    id: draft.id,
    adAccountId: draft.adAccountId,
    advertisingType: draft.advertisingType,
    name: draft.name,
    status: draft.status,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

export async function GET() {
  try {
    const drafts = await listCampaignDrafts();
    return ok(drafts.map(compactDraft), ["POST /api/campaign-drafts/{id}/validate"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = campaignDraftSchema.parse(await request.json());
    const draft = await createCampaignDraft(input);
    return ok(compactDraft(draft), [
      `POST /api/campaign-drafts/${draft.id}/validate`,
      "POST /api/launch-jobs",
    ]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
