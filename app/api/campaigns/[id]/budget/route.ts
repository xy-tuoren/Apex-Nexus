import { fail, ok, parseError } from "@/lib/api-response";
import { budgetUpdateSchema } from "@/lib/schemas/campaign";
import { updateCampaignBudget } from "@/server/services/launch-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const input = budgetUpdateSchema.parse(await request.json());
    const { id } = await context.params;
    const result = await updateCampaignBudget(id, input.budgetMicros);

    if (!result) {
      return fail({ code: "CAMPAIGN_NOT_FOUND", message: "广告资源映射不存在。" }, 404);
    }

    return ok(result, [`GET /api/campaigns/${id}/metrics`]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
