import { fail, ok, parseError } from "@/lib/api-response";
import { listConversionGoalPoints } from "@/server/services/conversion-goal-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ adAccountId: string }> },
) {
  try {
    const { adAccountId } = await context.params;
    const { searchParams } = new URL(request.url);
    const goals = await listConversionGoalPoints({
      adAccountId,
      customerId: searchParams.get("customerId"),
      loginCustomerId: searchParams.get("loginCustomerId"),
    });
    return ok(goals, ["POST /api/campaign-drafts"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
