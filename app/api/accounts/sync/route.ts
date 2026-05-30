import { ok, fail, parseError } from "@/lib/api-response";
import { syncAccounts } from "@/server/services/account-service";

export async function POST() {
  try {
    const result = await syncAccounts();
    return ok(result, ["GET /api/sites", "GET /api/sites/{siteId}/accounts"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
