import { fail, ok, parseError } from "@/lib/api-response";
import { campaignPresetCreateSchema } from "@/lib/schemas/campaign";
import {
  createCampaignPreset,
  listCampaignPresets,
} from "@/server/services/campaign-preset-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(10000, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10));
    const search = url.searchParams.get("search") ?? "";
    return ok(await listCampaignPresets(page, pageSize, search), ["POST /api/campaign-presets"]);
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
