import { fail, ok, parseError } from "@/lib/api-response";
import { validateAndMarkDraft } from "@/server/services/campaign-draft-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await validateAndMarkDraft(id);

    if (!result) {
      return fail({ code: "DRAFT_NOT_FOUND", message: "广告草稿不存在。" }, 404);
    }

    return ok(
      result,
      result.valid
        ? [`POST /api/campaign-drafts/${id}/build-preview`, "POST /api/launch-jobs"]
        : ["Fix validation errors"],
    );
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
