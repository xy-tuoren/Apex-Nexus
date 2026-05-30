import { fail, ok, parseError } from "@/lib/api-response";
import { getCampaignMetrics } from "@/server/services/launch-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const metrics = await getCampaignMetrics(id);
    return ok(metrics, ["POST /api/campaigns/{id}/budget", "POST /api/campaigns/{id}/pause"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
