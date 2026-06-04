import type { ComboboxOption } from "@/components/ui/combobox";
import type { GoogleAdAccount } from "@/lib/types";
import { POPULAR_COUNTRY_GEO_TARGETS } from "@/lib/google-ads/popular-geo-targets";
import {
  BIDDING_TYPE_OPTIONS,
  CLICK_BIDDING_TYPE_OPTIONS,
  CONVERSION_CATEGORY_LABELS,
  DEVICE_OPTIONS,
  DEVICE_SELECTABLE_VALUES,
  FALLBACK_GEO_TARGET_OPTIONS,
  FALLBACK_LANGUAGE_OPTIONS,
  OBJECTIVE_OPTIONS,
  OS_OPTIONS,
  OS_SELECTABLE_VALUES,
  SCHEDULE_DAYS,
  SCHEDULE_HOURS,
  DEFAULT_OS_SELECTION,
  DEFAULT_DEVICES_SELECTION,
} from "@/components/ads/campaign-hierarchy/constants";
import type { CampaignOverviewMeta } from "@/components/ads/campaign-overview";
import type {
  AdForm,
  AdGroupForm,
  ApiResult,
  BiddingType,
  CampaignForm,
  ClickBiddingType,
  ConversionGoalPoint,
  ExpandState,
  GeoTargetOption,
  LanguageTargetOption,
  ScheduleGridValue,
} from "@/components/ads/campaign-hierarchy/types";

export function buildInitialExpandState(adGroups: AdGroupForm[]): ExpandState {
  const adGroupsRecord: Record<string, boolean> = {};
  const adsRecord: Record<string, boolean> = {};

  for (const group of adGroups) {
    adGroupsRecord[group.id] = true;
    for (const ad of group.ads) {
      adsRecord[ad.id] = true;
    }
  }

  return { campaign: true, adGroups: adGroupsRecord, ads: adsRecord };
}

export function formatConversionGoalLabel(goal: ConversionGoalPoint) {
  const category = CONVERSION_CATEGORY_LABELS[goal.category] ?? goal.category;
  return `${category} · ${goal.actionCount} 个操作`;
}

export function fieldPathFromGoogleAdsLocation(location: unknown) {
  if (!location || typeof location !== "object" || !("fieldPathElements" in location)) {
    return "";
  }

  const elements = (location as { fieldPathElements?: Array<Record<string, unknown>> })
    .fieldPathElements;
  if (!Array.isArray(elements)) {
    return "";
  }

  return elements
    .map((element) => {
      const fieldName = typeof element.fieldName === "string" ? element.fieldName : "";
      const index = typeof element.index === "number" ? `[${element.index}]` : "";
      return `${fieldName}${index}`;
    })
    .filter(Boolean)
    .join(".");
}

export function formatErrorCode(errorCode: unknown) {
  if (!errorCode || typeof errorCode !== "object") {
    return "";
  }

  return Object.entries(errorCode as Record<string, unknown>)
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(", ");
}

function getGoogleAdsFailureDetails(error: ApiResult["error"]) {
  const detailItems =
    error?.details &&
      typeof error.details === "object" &&
      "error" in error.details &&
      error.details.error &&
      typeof error.details.error === "object" &&
      "details" in error.details.error
      ? (error.details.error as { details?: unknown[] }).details
      : [];

  if (!Array.isArray(detailItems)) {
    return [];
  }

  return detailItems;
}

function readNestedString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) {
      return value;
    }
  }
  return "";
}

function extractEvidenceLines(evidence: unknown) {
  if (!evidence || typeof evidence !== "object") {
    return [];
  }

  const record = evidence as Record<string, unknown>;
  const textList = record.textList;
  const websiteList = record.websiteList;
  const destinationTextList = record.destinationTextList;

  const values: string[] = [];
  if (textList && typeof textList === "object" && Array.isArray((textList as { texts?: unknown[] }).texts)) {
    values.push(...(textList as { texts: unknown[] }).texts.map(String));
  }
  if (websiteList && typeof websiteList === "object" && Array.isArray((websiteList as { websites?: unknown[] }).websites)) {
    values.push(...(websiteList as { websites: unknown[] }).websites.map(String));
  }
  if (
    destinationTextList &&
    typeof destinationTextList === "object" &&
    Array.isArray((destinationTextList as { destinationTexts?: unknown[] }).destinationTexts)
  ) {
    values.push(...(destinationTextList as { destinationTexts: unknown[] }).destinationTexts.map(String));
  }

  return values.filter(Boolean);
}

function extractPolicyTopics(googleError: Record<string, unknown>) {
  const details = googleError.details;
  if (!details || typeof details !== "object") {
    return [];
  }

  const policyFindingDetails = (details as { policyFindingDetails?: unknown }).policyFindingDetails;
  if (!policyFindingDetails || typeof policyFindingDetails !== "object") {
    return [];
  }

  const policyTopicEntries = (policyFindingDetails as { policyTopicEntries?: unknown }).policyTopicEntries;
  if (!Array.isArray(policyTopicEntries)) {
    return [];
  }

  return policyTopicEntries.map((entry) => {
    const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const nestedEntry =
      record.policyTopicEntry && typeof record.policyTopicEntry === "object"
        ? (record.policyTopicEntry as Record<string, unknown>)
        : record;
    const rawEvidences = Array.isArray(nestedEntry.evidences)
      ? nestedEntry.evidences
      : Array.isArray(record.evidences)
        ? record.evidences
        : [];
    const evidences = rawEvidences.length
      ? rawEvidences.flatMap(extractEvidenceLines)
      : [];

    return {
      topic: readNestedString(nestedEntry, ["topic", "policyTopic"]),
      type: readNestedString(nestedEntry, ["type", "policyTopicEntryType"]),
      evidences,
    };
  });
}

function operationIndexFromLocation(location: unknown) {
  if (!location || typeof location !== "object" || !("fieldPathElements" in location)) {
    return null;
  }

  const elements = (location as { fieldPathElements?: Array<Record<string, unknown>> }).fieldPathElements;
  const operationElement = elements?.find((element) => element.fieldName === "mutate_operations");
  return typeof operationElement?.index === "number" ? operationElement.index : null;
}

export function extractGoogleAdsErrors(error: ApiResult["error"]) {
  const detailItems = getGoogleAdsFailureDetails(error);

  return detailItems.flatMap((detail) => {
    if (!detail || typeof detail !== "object" || !("errors" in detail)) {
      return [];
    }

    const googleErrors = (detail as { errors?: Array<Record<string, unknown>> }).errors;
    if (!Array.isArray(googleErrors)) {
      return [];
    }

    return googleErrors.map((googleError) => {
      const message = typeof googleError.message === "string" ? googleError.message : "";
      const code = formatErrorCode(googleError.errorCode);
      const path = fieldPathFromGoogleAdsLocation(googleError.location);
      const trigger =
        typeof googleError.trigger === "string"
          ? googleError.trigger
          : googleError.trigger && typeof googleError.trigger === "object"
            ? Object.values(googleError.trigger as Record<string, unknown>)
              .map(String)
              .join(", ")
            : "";

      return {
        code,
        path,
        operationIndex: operationIndexFromLocation(googleError.location),
        trigger,
        message,
        policyTopics: extractPolicyTopics(googleError),
      };
    });
  });
}

export function extractGoogleAdsErrorLines(error: ApiResult["error"]) {
  return extractGoogleAdsErrors(error).map((googleError) => {
    const policyTopics = googleError.policyTopics
      .map((topic) => [topic.topic, topic.type, ...topic.evidences].filter(Boolean).join(" / "))
      .filter(Boolean)
      .join("；");

    return [googleError.code, googleError.path, googleError.trigger, policyTopics, googleError.message]
      .filter(Boolean)
      .join(" · ");
  });
}

export function notificationMessageFromResult(result: ApiResult) {
  if (result.success) {
    return "已成功推送到 Google Ads API。";
  }

  const googleAdsLines = extractGoogleAdsErrorLines(result.error);
  return [
    result.error?.message ?? "提交失败。",
    ...googleAdsLines.slice(0, 4),
  ].join("\n");
}

export function successMessageFromResult(result: ApiResult, fallback: string) {
  if (
    result.data &&
    typeof result.data === "object" &&
    "message" in result.data &&
    typeof result.data.message === "string"
  ) {
    return result.data.message;
  }

  return fallback;
}

export function defaultBiddingForObjective(objective: string) {
  if (objective === "CLICKS") {
    return { clickBiddingType: "MAX_CPC" as ClickBiddingType };
  }
  return { biddingType: "TARGET_CPA" as BiddingType };
}

export function summarizeGeoLocation(
  locations: string,
  geoTargets: GeoTargetOption[] = FALLBACK_GEO_TARGET_OPTIONS,
) {
  const value = splitLines(locations)[0] ?? locations.trim();
  if (!value) {
    return "未设置";
  }
  const match = geoTargets.find((target) => target.resourceName === value);
  if (match) {
    return geoTargetLabel(match);
  }
  return value.replace(/^geoTargetConstants\//, "") || value;
}

export function summarizeLanguageValue(
  language: string,
  languageTargets: LanguageTargetOption[] = FALLBACK_LANGUAGE_OPTIONS,
) {
  if (!language || language === "all") {
    return "所有语言";
  }
  const match = languageTargets.find((item) => item.resourceName === language);
  return match ? languageTargetLabel(match) : language;
}

export function isAllOsSelected(selection: string[]) {
  return selection.length >= OS_SELECTABLE_VALUES.length;
}

export function isAllDevicesSelected(selection: string[]) {
  return selection.length >= DEVICE_SELECTABLE_VALUES.length;
}

export function labelForOptionValue(
  value: string,
  options: Array<{ value: string; label: string }>,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function summarizeOsSelection(selection: string[]) {
  if (isAllOsSelected(selection)) {
    return "全部";
  }
  return selection
    .map((value) => labelForOptionValue(value, OS_OPTIONS))
    .join("、");
}

export function summarizeDevicesSelection(selection: string[]) {
  if (isAllDevicesSelected(selection)) {
    return "全部";
  }
  return selection
    .map((value) => labelForOptionValue(value, DEVICE_OPTIONS))
    .join("、");
}

export function summarizeOsDevice(os: string[], devices: string[]) {
  return `${summarizeOsSelection(os)} / ${summarizeDevicesSelection(devices)}`;
}

export function resolveOsPayload(selection: string[]) {
  if (isAllOsSelected(selection)) {
    return { os: "all", oss: [] as string[] };
  }
  return { os: selection[0], oss: selection };
}

export function resolveDevicePayload(selection: string[]) {
  if (isAllDevicesSelected(selection)) {
    return { device: "all", devices: [] as string[] };
  }
  return { device: selection[0], devices: selection };
}

export function summarizeScheduleBrief(schedule: ScheduleGridValue) {
  const allDaysEnabled = SCHEDULE_DAYS.every((day) =>
    (schedule[day.key] ?? []).every(Boolean),
  );
  if (allDaysEnabled) {
    return "全天投放";
  }
  const formatted = formatSchedule(schedule);
  return formatted.length > 28 ? `${formatted.slice(0, 28)}…` : formatted;
}

export function buildCampaignHighlights(
  campaign: CampaignForm,
  geoTargets: GeoTargetOption[],
  languageTargets: LanguageTargetOption[],
) {
  const highlights: string[] = [];
  const visibleGroups = campaign.adGroups.slice(0, 2);

  for (const group of visibleGroups) {
    highlights.push(
      `${group.name} · ${summarizeGeoLocation(group.locations, geoTargets)} · ${summarizeLanguageValue(group.language, languageTargets)}`,
    );
    const primaryAd = group.ads[0];
    if (primaryAd) {
      const url = primaryAd.finalUrl.replace(/^https?:\/\//, "");
      const urlPreview = url.length > 36 ? `${url.slice(0, 36)}…` : url;
      highlights.push(
        `${primaryAd.name} · ${primaryAd.businessName || "未填商家"} · ${urlPreview || "未填 URL"}`,
      );
    }
    if (group.ads.length > 1) {
      highlights.push(`  另有 ${group.ads.length - 1} 条广告`);
    }
  }

  if (campaign.adGroups.length > 2) {
    highlights.push(`… 还有 ${campaign.adGroups.length - 2} 个广告组`);
  }

  const allAds = campaign.adGroups.flatMap((group) => group.ads);
  const videoCount = allAds.reduce((total, ad) => total + splitLines(ad.videoLinks).length, 0);
  const headlineCount = allAds.reduce(
    (total, ad) => total + splitLines(ad.shortHeadlines).length,
    0,
  );
  const logoCount = allAds.reduce((total, ad) => total + splitMultiline(ad.logos).length, 0);
  highlights.push(`素材 ${videoCount} 视频 · ${headlineCount} 标题 · ${logoCount} 徽标`);

  highlights.push(`定向 ${summarizeOsDevice(campaign.os, campaign.devices)}`);
  highlights.push(`投放 ${summarizeScheduleBrief(campaign.adSchedule)}`);

  if (campaign.campaignObjective === "CONVERSIONS" && campaign.conversionGoal) {
    const goalLabel =
      CONVERSION_CATEGORY_LABELS[campaign.conversionGoal] ?? campaign.conversionGoal;
    highlights.push(`转化目标 ${goalLabel}`);
  }

  return highlights.slice(0, 7);
}

export function buildCampaignOverviewMeta(
  campaign: CampaignForm,
  index: number,
  adAccounts: GoogleAdAccount[],
  geoTargets: GeoTargetOption[] = FALLBACK_GEO_TARGET_OPTIONS,
  languageTargets: LanguageTargetOption[] = FALLBACK_LANGUAGE_OPTIONS,
): CampaignOverviewMeta {
  const selectedAccount = adAccounts.find((account) => account.id === campaign.adAccountId);
  const objective =
    OBJECTIVE_OPTIONS.find((option) => option.value === campaign.campaignObjective)?.label ??
    campaign.campaignObjective;
  const bidding =
    campaign.campaignObjective === "CONVERSIONS"
      ? campaign.biddingType === "TARGET_CPA"
        ? `目标 CPA ${campaign.targetCpa}`
        : "尽可能提高转化"
      : campaign.clickBiddingType === "MAX_CPC"
        ? `目标 CPC ${campaign.targetCpc}`
        : "尽可能提高点击";

  return {
    id: campaign.id,
    index: index + 1,
    name: campaign.campaignName,
    objective,
    bidding,
    budget: campaign.budgetDaily,
    adGroupCount: campaign.adGroups.length,
    adCount: campaign.adGroups.flatMap((group) => group.ads).length,
    accountId: selectedAccount?.customerId ?? "",
    accountName: selectedAccount?.name ?? "",
    typeBadge: campaign.advertisingType,
    highlights: buildCampaignHighlights(campaign, geoTargets, languageTargets),
    groups: campaign.adGroups.map((group) => ({
      id: group.id,
      name: group.name,
      summary: `${group.ads.length} ads · ${summarizeGeoLocation(group.locations, geoTargets)} · ${summarizeLanguageValue(group.language, languageTargets)}`,
      ads: group.ads.map((ad) => ({
        id: ad.id,
        name: ad.name,
        summary: [
          ad.businessName || "未填商家",
          ad.finalUrl.replace(/^https?:\/\//, ""),
          `${splitLines(ad.shortHeadlines).length} 标题`,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    })),
  };
}

export function buildDefaultSchedule() {
  return Object.fromEntries(
    SCHEDULE_DAYS.map((day) => [day.key, SCHEDULE_HOURS.map(() => true)]),
  ) as ScheduleGridValue;
}

export function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinLines(values: string[]) {
  return values.join("\n");
}

export function summarizeAdGroupCard(
  group: AdGroupForm,
  geoTargets: GeoTargetOption[] = FALLBACK_GEO_TARGET_OPTIONS,
  languageTargets: LanguageTargetOption[] = FALLBACK_LANGUAGE_OPTIONS,
) {
  const locationLabel = summarizeGeoLocation(group.locations, geoTargets);
  const languageLabel = summarizeLanguageValue(group.language, languageTargets);
  return `${group.ads.length} 条广告 · ${languageLabel} · ${locationLabel}`;
}

export function summarizeAdCard(ad: AdForm) {
  return `${splitLines(ad.shortHeadlines).length} 标题 · ${splitLines(ad.videoLinks).length} 视频 · ${ad.businessName || "未填商家名"}`;
}

/** Data URLs contain commas — only split on newlines. */
export function splitMultiline(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinMultiline(values: string[]) {
  return values.join("\n");
}

export function normalizeVideoInputs(value: string) {
  return splitLines(value)
    .map((item) => youtubeVideoIdFromInput(item))
    .filter((videoId): videoId is string => Boolean(videoId));
}

export function youtubeVideoIdFromInput(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\//, "") || null;
    }
    const videoId = url.searchParams.get("v");
    if (videoId) {
      return videoId;
    }
    const pathMatch = url.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/);
    return pathMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export function youtubeThumbnailUrl(value: string) {
  const videoId = youtubeVideoIdFromInput(value);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function fileToLogoDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("无法处理徽标图片。"));
        return;
      }

      context.clearRect(0, 0, size, size);
      const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const x = Math.round((size - width) / 2);
      const y = Math.round((size - height) / 2);
      context.drawImage(image, x, y, width, height);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("读取徽标图片失败。"));
    };
    image.src = objectUrl;
  });
}

export function microsFromAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 1_000_000;
  }
  return Math.round(amount * 1_000_000);
}

export function buildBiddingPayload(form: CampaignForm) {
  if (form.campaignObjective === "CLICKS") {
    return form.clickBiddingType === "MAX_CPC"
      ? {
        strategy: "MAXIMIZE_CLICKS" as const,
        maxCpcBidCeilingMicros: microsFromAmount(form.targetCpc),
      }
      : {
        strategy: "MAXIMIZE_CLICKS" as const,
      };
  }

  if (form.biddingType === "TARGET_CPA") {
    return {
      strategy: form.biddingType,
      targetCpaMicros: microsFromAmount(form.targetCpa),
    };
  }

  return { strategy: form.biddingType };
}

export function geoTargetLabel(target: GeoTargetOption) {
  const name = target.name || target.canonicalName || target.resourceName;
  return target.countryCode && name !== target.countryCode
    ? `${name} (${target.countryCode})`
    : name;
}

export function languageTargetLabel(language: LanguageTargetOption) {
  if (language.resourceName === "all") {
    return "所有语言";
  }
  return language.name || language.code || language.resourceName;
}

export function buildGeoTargetSelectOptions(
  geoTargets: GeoTargetOption[],
  activeLocation?: string,
): ComboboxOption[] {
  const aliasesByResourceName = new Map(
    POPULAR_COUNTRY_GEO_TARGETS.map((target) => [target.resourceName, target.aliases]),
  );
  const options = geoTargets.map((target) => ({
    value: target.resourceName,
    label: geoTargetLabel(target),
    keywords: [
      target.name,
      target.canonicalName,
      target.countryCode,
      target.targetType,
      ...(aliasesByResourceName.get(target.resourceName) ?? []),
    ],
  }));

  if (activeLocation && !options.some((option) => option.value === activeLocation)) {
    const fallbackTarget = FALLBACK_GEO_TARGET_OPTIONS.find(
      (target) => target.resourceName === activeLocation,
    );
    options.unshift({
      value: activeLocation,
      label: fallbackTarget ? geoTargetLabel(fallbackTarget) : activeLocation,
      keywords: fallbackTarget
        ? [fallbackTarget.name, fallbackTarget.canonicalName, fallbackTarget.countryCode]
        : [],
    });
  }

  return options;
}

export function buildLanguageTargetSelectOptions(
  languageTargets: LanguageTargetOption[],
  activeLanguage?: string,
): ComboboxOption[] {
  const options = languageTargets.map((language) => ({
    value: language.resourceName,
    label: languageTargetLabel(language),
    keywords: [language.name, language.code, language.id],
  }));

  if (activeLanguage && !options.some((option) => option.value === activeLanguage)) {
    options.unshift({ value: activeLanguage, label: activeLanguage, keywords: [] });
  }

  return options;
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function rangesFromHours(hours: boolean[]) {
  const ranges: Array<[number, number]> = [];
  let start: number | null = null;

  hours.forEach((enabled, index) => {
    if (enabled && start === null) {
      start = index;
    }
    if ((!enabled || index === hours.length - 1) && start !== null) {
      const end = enabled && index === hours.length - 1 ? index + 1 : index;
      ranges.push([start, end]);
      start = null;
    }
  });

  return ranges;
}

export function formatSchedule(schedule: ScheduleGridValue) {
  return SCHEDULE_DAYS.map((day) => {
    const ranges = rangesFromHours(schedule[day.key] ?? []);
    if (ranges.length === 0) {
      return `${day.label}：关闭`;
    }
    return `${day.label}：${ranges
      .map(([start, end]) => `${formatHour(start)}-${formatHour(end)}`)
      .join("、")}`;
  }).join("；");
}

export function createDefaultAd(index = 1): AdForm {
  return {
    id: `ad_${index}`,
    name: `广告 ${index}`,
    finalUrl: "",
    videoLinks: "",
    logos: "",
    shortHeadlines: "",
    longHeadlines: "",
    descriptions: "",
    callToAction: "PLAY_NOW",
    businessName: "",
  };
}

export function createDefaultAdGroup(index = 1): AdGroupForm {
  return {
    id: `adg_${index}`,
    name: `广告组 ${index}`,
    locations: "geoTargetConstants/2840",
    language: "all",
    genders: ["FEMALE", "MALE", "UNDETERMINED"],
    ageRanges: ["18", "25", "35", "45", "55", "65"],
    includeUnknownAge: true,
    ads: [createDefaultAd(1)],
  };
}

export function buildDefaultCampaign(index: number, account?: GoogleAdAccount): CampaignForm {
  return {
    id: `cmp_${index}`,
    adAccountId: account?.id ?? "",
    advertisingType: "DEMAND_GEN",
    campaignName: `广告系列 ${index}`,
    campaignObjective: "CONVERSIONS",
    conversionGoal: "PURCHASE",
    biddingType: "TARGET_CPA",
    clickBiddingType: "MAX_CPC",
    targetCpa: "1.2",
    targetCpc: "0.45",
    budgetDaily: "20",
    os: [...DEFAULT_OS_SELECTION],
    devices: [...DEFAULT_DEVICES_SELECTION],
    adSchedule: buildDefaultSchedule(),
    trackingTemplate: "",
    finalUrlSuffix: "gad_campaignid={campaignid}",
    ipExclusions: "",
    adGroups: [createDefaultAdGroup(1)],
  };
}


export function buildPayloadFromCampaign(campaign: CampaignForm, firstAdFallback: AdForm) {
  const adGroups = campaign.adGroups.map((group) => ({
    id: group.id,
    name: group.name,
    locations: splitLines(group.locations),
    language: group.language,
    demographics: {
      genders: group.genders,
      ageRange: {
        ranges: group.ageRanges,
        includeUnknown: group.includeUnknownAge,
      },
    },
    ads: group.ads.map((ad) => ({
      id: ad.id,
      name: ad.name,
      finalUrl: ad.finalUrl,
      youtubeVideos: normalizeVideoInputs(ad.videoLinks),
      logos: splitMultiline(ad.logos),
      headlines: splitLines(ad.shortHeadlines),
      longHeadlines: splitLines(ad.longHeadlines),
      descriptions: splitLines(ad.descriptions),
      callToAction: ad.callToAction,
      businessName: ad.businessName,
    })),
  }));

  const primaryAdGroup = adGroups[0];
  const primaryAd = primaryAdGroup?.ads[0];
  const osPayload = resolveOsPayload(campaign.os);
  const devicePayload = resolveDevicePayload(campaign.devices);
  const bidding = buildBiddingPayload(campaign);

  return {
    adAccountId: campaign.adAccountId,
    advertisingType: campaign.advertisingType,
    name: campaign.campaignName,
    campaignObjective: campaign.campaignObjective,
    conversionGoal:
      campaign.campaignObjective === "CONVERSIONS" ? campaign.conversionGoal : undefined,
    finalUrl: primaryAd?.finalUrl ?? firstAdFallback.finalUrl,
    budgetMicros: microsFromAmount(campaign.budgetDaily),
    bidding,
    locations: primaryAdGroup?.locations.length ? primaryAdGroup.locations : ["geoTargetConstants/2840"],
    language: primaryAdGroup?.language ?? "zh-CN",
    os: osPayload.os,
    oss: osPayload.oss,
    device: devicePayload.device,
    devices: devicePayload.devices,
    adSchedule: campaign.adSchedule,
    trackingTemplate: campaign.trackingTemplate || undefined,
    finalUrlSuffix: campaign.finalUrlSuffix,
    ipExclusions: splitLines(campaign.ipExclusions),
    assets: {
      headlines: primaryAd?.headlines ?? [],
      longHeadlines: primaryAd?.longHeadlines ?? [],
      descriptions: primaryAd?.descriptions ?? [],
      businessName: primaryAd?.businessName ?? firstAdFallback.businessName,
      logos: primaryAd?.logos ?? [],
      youtubeVideos: primaryAd?.youtubeVideos ?? [],
    },
    demandGen: {
      adGroupName: primaryAdGroup?.name ?? "Main Ad Group",
    },
    adGroups,
  };
}
