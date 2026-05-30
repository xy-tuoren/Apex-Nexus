import { fail, ok, parseError } from "@/lib/api-response";
import { getLaunchJob } from "@/server/services/launch-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const job = await getLaunchJob(id);

    if (!job) {
      return fail({ code: "JOB_NOT_FOUND", message: "投放任务不存在。" }, 404);
    }

    return ok(job, job.status === "SUCCEEDED" ? ["POST /api/campaigns/{id}/enable"] : []);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
