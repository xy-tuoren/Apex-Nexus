import { fail, ok, parseError } from "@/lib/api-response";
import { getLaunchBatch } from "@/server/services/launch-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const batch = await getLaunchBatch(id);
    if (!batch) {
      return fail({ code: "BATCH_NOT_FOUND", message: "创建批次不存在。" }, 404);
    }
    return ok(batch);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
