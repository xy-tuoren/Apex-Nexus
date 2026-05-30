import { ok, fail, parseError } from "@/lib/api-response";
import { listSites } from "@/server/services/account-service";

export async function GET() {
  try {
    const sites = await listSites();
    return ok(sites, ["GET /api/sites/{siteId}/accounts"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
