import { fail, ok, parseError } from "@/lib/api-response";
import {
  getCachedConversionGoalSet,
  syncDataMccConversionGoalSet,
} from "@/server/services/conversion-goal-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ mccAccountId: string }> },
) {
  try {
    const { mccAccountId } = await context.params;
    const goalSet = await getCachedConversionGoalSet(mccAccountId);
    return ok(goalSet, ["POST /api/google-ads/mccs/:mccAccountId/conversion-goals"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ mccAccountId: string }> },
) {
  try {
    const { mccAccountId } = await context.params;
    const goalSet = await syncDataMccConversionGoalSet(mccAccountId);
    return ok(goalSet, ["POST /api/campaign-drafts"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
