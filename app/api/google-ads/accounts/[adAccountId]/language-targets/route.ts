import { fail, ok, parseError } from "@/lib/api-response";
import { listLanguageTargetOptions } from "@/server/services/language-target-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ adAccountId: string }> },
) {
  try {
    const { adAccountId } = await context.params;
    const { searchParams } = new URL(request.url);
    const languages = await listLanguageTargetOptions({
      adAccountId,
      customerId: searchParams.get("customerId"),
      loginCustomerId: searchParams.get("loginCustomerId"),
    });

    return ok(languages, ["GET /api/google-ads/accounts/:adAccountId/language-targets"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
