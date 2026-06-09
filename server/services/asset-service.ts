import type { ApiError, CreativeAsset } from "@/lib/types";
import type { AssetInput } from "@/lib/schemas/campaign";
import { DEMAND_GEN_AD_LIMITS } from "@/lib/google-ads/demand-gen-limits";
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
    if (assets.headlines.length > DEMAND_GEN_AD_LIMITS.headlines) {
      errors.push({
        code: "DEMAND_GEN_TOO_MANY_HEADLINES",
        message: `Demand Gen 短标题最多 ${DEMAND_GEN_AD_LIMITS.headlines} 条。`,
        details: { count: assets.headlines.length, max: DEMAND_GEN_AD_LIMITS.headlines },
      });
    }
    if (assets.longHeadlines.length > DEMAND_GEN_AD_LIMITS.longHeadlines) {
      errors.push({
        code: "DEMAND_GEN_TOO_MANY_LONG_HEADLINES",
        message: `Demand Gen 长标题最多 ${DEMAND_GEN_AD_LIMITS.longHeadlines} 条。`,
        details: { count: assets.longHeadlines.length, max: DEMAND_GEN_AD_LIMITS.longHeadlines },
      });
    }
    if (assets.descriptions.length > DEMAND_GEN_AD_LIMITS.descriptions) {
      errors.push({
        code: "DEMAND_GEN_TOO_MANY_DESCRIPTIONS",
        message: `Demand Gen 广告内容描述最多 ${DEMAND_GEN_AD_LIMITS.descriptions} 条。`,
        details: { count: assets.descriptions.length, max: DEMAND_GEN_AD_LIMITS.descriptions },
      });
    }
    if (assets.youtubeVideos.length > DEMAND_GEN_AD_LIMITS.youtubeVideos) {
      errors.push({
        code: "DEMAND_GEN_TOO_MANY_VIDEOS",
        message: `Demand Gen 视频素材最多 ${DEMAND_GEN_AD_LIMITS.youtubeVideos} 条。`,
        details: { count: assets.youtubeVideos.length, max: DEMAND_GEN_AD_LIMITS.youtubeVideos },
      });
    }
    if (assets.logos.length > DEMAND_GEN_AD_LIMITS.logos) {
      errors.push({
        code: "DEMAND_GEN_TOO_MANY_LOGOS",
        message: `Demand Gen Logo 最多 ${DEMAND_GEN_AD_LIMITS.logos} 个。`,
        details: { count: assets.logos.length, max: DEMAND_GEN_AD_LIMITS.logos },
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
