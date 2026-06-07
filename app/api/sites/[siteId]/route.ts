import { fail, ok, parseError } from "@/lib/api-response";
import { siteUpdateSchema } from "@/lib/schemas/campaign";
import { deleteSite, updateSiteBinding } from "@/server/services/account-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await context.params;
    const input = siteUpdateSchema.parse(await request.json());
    const site = await updateSiteBinding(siteId, input);
    if (!site) {
      return fail({ code: "SITE_NOT_FOUND", message: "站点不存在。" }, 404);
    }
    return ok(site, ["GET /api/sites", "GET /api/sites/{siteId}/accounts", "DELETE /api/sites/{siteId}"]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await context.params;
    const site = await deleteSite(siteId);
    if (!site) {
      return fail({ code: "SITE_NOT_FOUND", message: "站点不存在。" }, 404);
    }
    return ok(site, ["GET /api/sites"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
