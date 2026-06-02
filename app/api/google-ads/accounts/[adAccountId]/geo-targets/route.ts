import { fail, ok, parseError } from "@/lib/api-response";
import { listGeoTargetOptions } from "@/server/services/geo-target-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ adAccountId: string }> },
) {
  try {
    const { adAccountId } = await context.params;
    const { searchParams } = new URL(request.url);
    const targets = await listGeoTargetOptions({
      adAccountId,
      customerId: searchParams.get("customerId"),
      loginCustomerId: searchParams.get("loginCustomerId"),
      query: searchParams.get("query"),
    });

    return ok(targets, ["GET /api/google-ads/accounts/:adAccountId/geo-targets?query=United"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
