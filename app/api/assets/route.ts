import { fail, ok, parseError } from "@/lib/api-response";
import { assetPayloadSchema } from "@/lib/schemas/campaign";
import { createAsset, listAssets } from "@/server/services/asset-service";

export async function GET() {
  try {
    const assets = await listAssets();
    return ok(assets, ["POST /api/assets/validate"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = assetPayloadSchema.parse(await request.json());
    const asset = await createAsset(input);
    return ok(asset, ["POST /api/assets/validate"]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
