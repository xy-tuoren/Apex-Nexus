import { fail, ok, parseError } from "@/lib/api-response";
import { listAccountsForSite } from "@/server/services/account-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await context.params;
    const accounts = await listAccountsForSite(siteId);
    return ok(accounts, ["POST /api/campaign-drafts"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
