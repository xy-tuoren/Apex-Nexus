import { fail, ok, parseError } from "@/lib/api-response";
import { campaignPresetCreateSchema } from "@/lib/schemas/campaign";
import {
  createCampaignPreset,
  listCampaignPresets,
} from "@/server/services/campaign-preset-service";

export async function GET() {
  try {
    return ok(await listCampaignPresets(), ["POST /api/campaign-presets"]);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = campaignPresetCreateSchema.parse(await request.json());
    const preset = await createCampaignPreset(input);
    return ok(preset, [`PATCH /api/campaign-presets/${preset.id}`]);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}
