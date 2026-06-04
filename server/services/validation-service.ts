import type { AdCreativeDraft, ApiError, CampaignDraft, DraftValidationResult } from "@/lib/types";
import { validateAssetBundle } from "@/server/services/asset-service";
import {
  findById,
  insertOne,
  listCollection,
  timestamp,
} from "@/server/repositories/data-store";

function domainFromUrl(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function assetsFromAd(ad: AdCreativeDraft) {
  return {
    headlines: ad.headlines,
    longHeadlines: ad.longHeadlines,
    descriptions: ad.descriptions,
    businessName: ad.businessName,
    logos: ad.logos,
    youtubeVideos: ad.youtubeVideos,
  };
}

function detailRecord(details: unknown) {
  return details && typeof details === "object" && !Array.isArray(details)
    ? (details as Record<string, unknown>)
    : {};
}

export async function validateCampaignDraft(
  draft: CampaignDraft,
): Promise<DraftValidationResult> {
  const errors: ApiError[] = [];
  const warnings: ApiError[] = [];

  const [site, adAccount] = await Promise.all([
    draft.siteId ? findById("sites", draft.siteId) : Promise.resolve(null),
    findById("google_ad_accounts", draft.adAccountId),
  ]);

  if (draft.siteId && !site) {
    errors.push({ code: "SITE_NOT_FOUND", message: "站点不存在或无权限访问。" });
  }

  if (!adAccount) {
    errors.push({ code: "AD_ACCOUNT_NOT_FOUND", message: "真实投放账号不存在或无权限访问。" });
  }

  if (site) {
    const finalUrlDomain = domainFromUrl(draft.finalUrl);
    if (finalUrlDomain !== site.domain && !finalUrlDomain.endsWith(`.${site.domain}`)) {
      errors.push({
        code: "FINAL_URL_DOMAIN_MISMATCH",
        message: "最终 URL 域名必须匹配站点域名或其子域名。",
        details: { expectedDomain: site.domain, finalUrlDomain },
      });
    }

    draft.adGroups?.forEach((group) => {
      group.ads.forEach((ad) => {
        const adFinalUrlDomain = domainFromUrl(ad.finalUrl);
        if (adFinalUrlDomain !== site.domain && !adFinalUrlDomain.endsWith(`.${site.domain}`)) {
          errors.push({
            code: "AD_FINAL_URL_DOMAIN_MISMATCH",
            message: "广告最终到达网址域名必须匹配站点域名或其子域名。",
            details: {
              adName: ad.name,
              expectedDomain: site.domain,
              finalUrlDomain: adFinalUrlDomain,
            },
          });
        }
      });
    });

    if (draft.budgetMicros > site.dailyBudgetLimitMicros) {
      errors.push({
        code: "BUDGET_LIMIT_EXCEEDED",
        message: "预算超过站点单日预算上限。",
        details: {
          budgetMicros: draft.budgetMicros,
          dailyBudgetLimitMicros: site.dailyBudgetLimitMicros,
        },
      });
    }
  }

  const assetResult = validateAssetBundle(draft.advertisingType, draft.assets);
  errors.push(...assetResult.errors);
  warnings.push(...assetResult.warnings);

  draft.adGroups?.forEach((group) => {
    group.ads.forEach((ad) => {
      const adAssetResult = validateAssetBundle(draft.advertisingType, assetsFromAd(ad));
      errors.push(
        ...adAssetResult.errors.map((error) => ({
          ...error,
          details: { ...detailRecord(error.details), adGroup: group.name, ad: ad.name },
        })),
      );
      warnings.push(
        ...adAssetResult.warnings.map((warning) => ({
          ...warning,
          details: {
            ...detailRecord(warning.details),
            adGroup: group.name,
            ad: ad.name,
          },
        })),
      );
    });
  });

  if (draft.advertisingType === "DEMAND_GEN" && !draft.demandGen && !draft.adGroups?.length) {
    errors.push({
      code: "DEMAND_GEN_SETTINGS_REQUIRED",
      message: "Demand Gen 草稿必须包含广告组名称和渠道控制。",
    });
  }

  const result: DraftValidationResult = {
    draftId: draft.id,
    valid: errors.length === 0,
    errors,
    warnings,
    checkedAt: timestamp(),
  };

  await insertOne("draft_validation_results", result);

  return result;
}

export async function validateLaunchEligibility(draftId: string) {
  const draft = await findById("campaign_drafts", draftId);
  if (!draft) {
    return {
      valid: false,
      errors: [{ code: "DRAFT_NOT_FOUND", message: "广告草稿不存在。" }],
      warnings: [],
      draft: null,
    };
  }

  const result = await validateCampaignDraft(draft);
  const existingJobs = await listCollection("launch_jobs");
  const activeJob = existingJobs.find(
    (job) => job.draftId === draftId && ["QUEUED", "RUNNING", "SUCCEEDED"].includes(job.status),
  );

  if (activeJob) {
    result.errors.push({
      code: "DRAFT_ALREADY_SUBMITTED",
      message: "该草稿已经创建过投放任务，不能重复提交。",
      details: { jobId: activeJob.id, status: activeJob.status },
    });
    result.valid = false;
  }

  return {
    ...result,
    draft,
  };
}
