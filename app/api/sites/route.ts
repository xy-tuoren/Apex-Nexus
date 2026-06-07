import { ok, fail, parseError } from "@/lib/api-response";
import { siteCreateSchema } from "@/lib/schemas/campaign";
import { createSite, listSites } from "@/server/services/account-service";

export async function GET() {
  try {
    const sites = await listSites();
    return ok(sites, ["POST /api/sites", "PATCH /api/sites/{siteId}"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = siteCreateSchema.parse(await request.json());
    const site = await createSite(input);
    return ok(site, ["GET /api/sites", "GET /api/sites/{siteId}/accounts"]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
