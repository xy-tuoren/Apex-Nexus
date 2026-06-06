import { after } from "next/server";
import { fail, ok, parseError } from "@/lib/api-response";
import { launchBatchCreateSchema } from "@/lib/schemas/campaign";
import {
  createLaunchBatch,
  listLaunchBatches,
  runLaunchBatch,
} from "@/server/services/launch-service";

export async function GET() {
  try {
    return ok(await listLaunchBatches(), ["GET /api/launch-batches/{id}"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = launchBatchCreateSchema.parse(await request.json());
    const batch = await createLaunchBatch(input);
    after(async () => {
      await runLaunchBatch(batch.id);
    });
    return ok(batch, [`GET /api/launch-batches/${batch.id}`]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
