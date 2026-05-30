import { fail, ok, parseError } from "@/lib/api-response";
import { assetValidationSchema } from "@/lib/schemas/campaign";
import { validateAssetBundle } from "@/server/services/asset-service";

export async function POST(request: Request) {
  try {
    const input = assetValidationSchema.parse(await request.json());
    const result = validateAssetBundle(input.advertisingType, input.assets);
    return ok(result, result.valid ? ["POST /api/campaign-drafts"] : ["Fix asset errors"]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
