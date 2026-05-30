import { fail, ok, parseError } from "@/lib/api-response";
import { campaignActionSchema } from "@/lib/schemas/campaign";
import { updateCampaignStatus } from "@/server/services/launch-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    campaignActionSchema.parse(await request.json().catch(() => ({})));
    const { id } = await context.params;
    const campaign = await updateCampaignStatus(id, "ENABLED");

    if (!campaign) {
      return fail({ code: "CAMPAIGN_NOT_FOUND", message: "广告资源映射不存在。" }, 404);
    }

    return ok(campaign, [`GET /api/campaigns/${id}/metrics`]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
