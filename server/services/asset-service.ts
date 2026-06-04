import type { ApiError, CreativeAsset } from "@/lib/types";
import type { AssetInput } from "@/lib/schemas/campaign";
import {
  audit,
  insertOne,
  listCollection,
  newId,
  timestamp,
} from "@/server/repositories/data-store";

export function validateAssetBundle(
  advertisingType: "DEMAND_GEN",
  assets: {
    headlines: string[];
    longHeadlines: string[];
    descriptions: string[];
    businessName: string;
    logos: string[];
    youtubeVideos: string[];
  },
) {
  const errors: ApiError[] = [];
  const warnings: ApiError[] = [];

  if (assets.businessName.length > 25) {
    errors.push({
      code: "BUSINESS_NAME_TOO_LONG",
      message: "品牌名称不能超过 25 个字符。",
    });
  }

  if (advertisingType === "DEMAND_GEN") {
    if (assets.headlines.length < 1 || assets.descriptions.length < 1) {
      errors.push({
        code: "DEMAND_GEN_TEXT_REQUIRED",
        message: "Demand Gen 至少需要 1 个标题和 1 条描述。",
      });
    }
    if (assets.youtubeVideos.length < 1) {
      errors.push({
        code: "DEMAND_GEN_VIDEO_REQUIRED",
        message: "Demand Gen 视频响应式广告至少需要 1 个 YouTube 视频。",
      });
    }
    if (assets.logos.length < 1) {
      errors.push({
        code: "DEMAND_GEN_LOGO_REQUIRED",
        message: "Demand Gen 视频响应式广告至少需要 1 个 Logo。",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function createAsset(input: AssetInput) {
  const asset: CreativeAsset = {
    id: newId("asset"),
    siteId: input.siteId,
    name: input.name,
    type: input.type,
    text: input.text,
    url: input.url,
    youtubeVideoId: input.youtubeVideoId,
    width: input.width,
    height: input.height,
    validationStatus: "PENDING",
    createdAt: timestamp(),
  };

  await insertOne("assets", asset);
  await audit("asset.create", asset.id, asset);

  return asset;
}

export async function listAssets() {
  return listCollection("assets");
}
