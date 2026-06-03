import { fail, ok, parseError } from "@/lib/api-response";
import { launchJobSchema } from "@/lib/schemas/campaign";
import type { LaunchJob } from "@/lib/types";
import { createLaunchJob, listLaunchJobs } from "@/server/services/launch-service";

function compactLaunchJob(job: LaunchJob | null) {
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    draftId: job.draftId,
    idempotencyKey: job.idempotencyKey,
    status: job.status,
    error: job.error,
    result: job.result,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export async function GET() {
  try {
    const jobs = await listLaunchJobs();
    return ok(jobs.map(compactLaunchJob), ["GET /api/launch-jobs/{id}"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = launchJobSchema.parse(await request.json());
    const job = await createLaunchJob(input.draftId, input.idempotencyKey);
    if (job?.status === "FAILED") {
      return fail(
        job.error ?? { code: "LAUNCH_JOB_FAILED", message: "Google Ads 推送失败。" },
        400,
        ["POST /api/launch-jobs"],
      );
    }
    return ok(compactLaunchJob(job), [`GET /api/launch-jobs/${job?.id}`]);
  } catch (error) {
    return fail(parseError(error), 400, ["POST /api/campaign-drafts/{id}/validate"]);
  }
}
