import { fail, ok, parseError } from "@/lib/api-response";
import { campaignDraftSchema } from "@/lib/schemas/campaign";
import {
  createCampaignDraft,
  listCampaignDrafts,
} from "@/server/services/campaign-draft-service";

export async function GET() {
  try {
    const drafts = await listCampaignDrafts();
    return ok(drafts, ["POST /api/campaign-drafts/{id}/validate"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = campaignDraftSchema.parse(await request.json());
    const draft = await createCampaignDraft(input);
    return ok(draft, [
      `POST /api/campaign-drafts/${draft.id}/validate`,
      `POST /api/campaign-drafts/${draft.id}/build-preview`,
    ]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
