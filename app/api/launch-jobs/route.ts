import { fail, ok, parseError } from "@/lib/api-response";
import { launchJobSchema } from "@/lib/schemas/campaign";
import { createLaunchJob, listLaunchJobs } from "@/server/services/launch-service";

export async function GET() {
  try {
    const jobs = await listLaunchJobs();
    return ok(jobs, ["GET /api/launch-jobs/{id}"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = launchJobSchema.parse(await request.json());
    const job = await createLaunchJob(input.draftId, input.idempotencyKey);
    return ok(job, [`GET /api/launch-jobs/${job?.id}`]);
  } catch (error) {
    return fail(parseError(error), 400, ["POST /api/campaign-drafts/{id}/validate"]);
  }
}
