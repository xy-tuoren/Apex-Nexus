import { fail, ok, parseError } from "@/lib/api-response";
import { buildDraftPreview } from "@/server/services/campaign-draft-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const preview = await buildDraftPreview(id);

    if (!preview) {
      return fail({ code: "DRAFT_NOT_FOUND", message: "广告草稿不存在。" }, 404);
    }

    return ok(preview, ["POST /api/launch-jobs"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
