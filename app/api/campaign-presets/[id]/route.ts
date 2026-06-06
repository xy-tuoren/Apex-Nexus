import { fail, ok, parseError } from "@/lib/api-response";
import { campaignPresetUpdateSchema } from "@/lib/schemas/campaign";
import {
  deleteCampaignPreset,
  updateCampaignPreset,
} from "@/server/services/campaign-preset-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const input = campaignPresetUpdateSchema.parse(await request.json());
    const preset = await updateCampaignPreset(id, input);
    if (!preset) {
      return fail({ code: "PRESET_NOT_FOUND", message: "预设配置不存在。" }, 404);
    }
    return ok(preset);
  } catch (error) {
    return fail(parseError(error), 400);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const preset = await deleteCampaignPreset(id);
    if (!preset) {
      return fail({ code: "PRESET_NOT_FOUND", message: "预设配置不存在。" }, 404);
    }
    return ok(preset);
  } catch (error) {
    return fail(parseError(error), 500);
  }
}
