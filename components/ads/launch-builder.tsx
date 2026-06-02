"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  HierarchySectionLabel,
  HierarchySummaryCard,
} from "@/components/ads/hierarchy-item";
import {
  CampaignOverviewAddTile,
  CampaignOverviewCard,
  type CampaignOverviewMeta,
} from "@/components/ads/campaign-overview";
import type {
  AdvertisingType,
  GoogleAdAccount,
  GoogleMccAccount,
} from "@/lib/types";

type ApiResult = {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  nextActions?: string[];
};

type LaunchBuilderProps = {
  initialAdAccounts: GoogleAdAccount[];
  accountSyncError?: string | null;
  accountsSyncedAt?: string | null;
  initialMccAccounts?: GoogleMccAccount[];
};

type SyncPayload = {
  mccAccounts: GoogleMccAccount[];
  adAccounts: GoogleAdAccount[];
  syncedAt: string;
  accessibleCustomerIds: string[];
};

type ConversionGoalPoint = {
  id: string;
  category: string;
  origin: string;
  biddable: boolean;
  source: string;
  actionCount: number;
  actions: {
    id: string;
    name: string;
    category: string;
    type: string;
    status: string;
    includeInConversionsMetric: boolean;
    primaryForGoal: boolean;
  }[];
};

type GeoTargetOption = {
  resourceName: string;
  id: string;
  name: string;
  canonicalName: string;
  countryCode: string;
  targetType: string;
  status: string;
};

type LanguageTargetOption = {
  resourceName: string;
  id: string;
  code: string;
  name: string;
  targetable: boolean;
};

type AdForm = {
  id: string;
  name: string;
  finalUrl: string;
  videoLinks: string;
  logos: string;
  shortHeadlines: string;
  longHeadlines: string;
  descriptions: string;
  callToAction: string;
  businessName: string;
};

type AdGroupForm = {
  id: string;
  name: string;
  locations: string;
  audienceSignals: string;
  language: string;
  genders: string[];
  ageMin: string;
  ageMax: string;
  includeUnknownAge: boolean;
  ads: AdForm[];
};

type ScheduleGridValue = Record<string, boolean[]>;
type BiddingType = "TARGET_CPA" | "MAXIMIZE_CONVERSIONS";
type ClickBiddingType = "MAXIMIZE_CLICKS" | "MAX_CPC";

type CampaignForm = {
  id: string;
  adAccountId: string;
  advertisingType: AdvertisingType;
  campaignName: string;
  campaignObjective: string;
  conversionGoal: string;
  biddingType: BiddingType;
  clickBiddingType: ClickBiddingType;
  targetCpa: string;
  targetCpc: string;
  budgetDaily: string;
  os: string;
  device: string;
  adSchedule: ScheduleGridValue;
  trackingTemplate: string;
  finalUrlSuffix: string;
  ipExclusions: string;
  adGroups: AdGroupForm[];
};

const inputGridClassName = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

type ExpandState = {
  campaign: boolean;
  adGroups: Record<string, boolean>;
  ads: Record<string, boolean>;
};

function buildInitialExpandState(adGroups: AdGroupForm[]): ExpandState {
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

const OS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iOS" },
  { value: "WINDOWS", label: "Windows" },
  { value: "MAC_OS", label: "macOS" },
  { value: "CHROME_OS", label: "ChromeOS" },
];

const DEVICE_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "DESKTOP", label: "桌面" },
  { value: "MOBILE", label: "移动" },
  { value: "TABLET", label: "平板" },
  { value: "CONNECTED_TV", label: "电视" },
];

const GENDER_OPTIONS = [
  { value: "FEMALE", label: "女" },
  { value: "MALE", label: "男" },
  { value: "UNDETERMINED", label: "未知" },
];

const AGE_OPTIONS = [
  { value: "18", label: "18" },
  { value: "25", label: "25" },
  { value: "35", label: "35" },
  { value: "45", label: "45" },
  { value: "55", label: "55" },
  { value: "65", label: "65 岁以上" },
];

const FALLBACK_GEO_TARGET_OPTIONS: GeoTargetOption[] = [
  {
    resourceName: "geoTargetConstants/2840",
    id: "2840",
    name: "United States",
    canonicalName: "United States",
    countryCode: "US",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2124",
    id: "2124",
    name: "Canada",
    canonicalName: "Canada",
    countryCode: "CA",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2826",
    id: "2826",
    name: "United Kingdom",
    canonicalName: "United Kingdom",
    countryCode: "GB",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2036",
    id: "2036",
    name: "Australia",
    canonicalName: "Australia",
    countryCode: "AU",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2276",
    id: "2276",
    name: "Germany",
    canonicalName: "Germany",
    countryCode: "DE",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2250",
    id: "2250",
    name: "France",
    canonicalName: "France",
    countryCode: "FR",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2380",
    id: "2380",
    name: "Italy",
    canonicalName: "Italy",
    countryCode: "IT",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2724",
    id: "2724",
    name: "Spain",
    canonicalName: "Spain",
    countryCode: "ES",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2528",
    id: "2528",
    name: "Netherlands",
    canonicalName: "Netherlands",
    countryCode: "NL",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2356",
    id: "2356",
    name: "India",
    canonicalName: "India",
    countryCode: "IN",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2076",
    id: "2076",
    name: "Brazil",
    canonicalName: "Brazil",
    countryCode: "BR",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2484",
    id: "2484",
    name: "Mexico",
    canonicalName: "Mexico",
    countryCode: "MX",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2702",
    id: "2702",
    name: "Singapore",
    canonicalName: "Singapore",
    countryCode: "SG",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2410",
    id: "2410",
    name: "South Korea",
    canonicalName: "South Korea",
    countryCode: "KR",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2392",
    id: "2392",
    name: "Japan",
    canonicalName: "Japan",
    countryCode: "JP",
    targetType: "Country",
    status: "ENABLED",
  },
];

const FALLBACK_LANGUAGE_OPTIONS: LanguageTargetOption[] = [
  { resourceName: "all", id: "all", code: "all", name: "所有语言", targetable: true },
  { resourceName: "languageConstants/1000", id: "1000", code: "en", name: "English", targetable: true },
  { resourceName: "languageConstants/1017", id: "1017", code: "zh", name: "Chinese", targetable: true },
  { resourceName: "languageConstants/1003", id: "1003", code: "es", name: "Spanish", targetable: true },
  { resourceName: "languageConstants/1002", id: "1002", code: "fr", name: "French", targetable: true },
  { resourceName: "languageConstants/1001", id: "1001", code: "de", name: "German", targetable: true },
  { resourceName: "languageConstants/1005", id: "1005", code: "ja", name: "Japanese", targetable: true },
  { resourceName: "languageConstants/1012", id: "1012", code: "ko", name: "Korean", targetable: true },
  { resourceName: "languageConstants/1018", id: "1018", code: "pt", name: "Portuguese", targetable: true },
  { resourceName: "languageConstants/1004", id: "1004", code: "it", name: "Italian", targetable: true },
  { resourceName: "languageConstants/1011", id: "1011", code: "nl", name: "Dutch", targetable: true },
  { resourceName: "languageConstants/1035", id: "1035", code: "ru", name: "Russian", targetable: true },
  { resourceName: "languageConstants/1023", id: "1023", code: "ar", name: "Arabic", targetable: true },
  { resourceName: "languageConstants/1027", id: "1027", code: "hi", name: "Hindi", targetable: true },
  { resourceName: "languageConstants/1041", id: "1041", code: "tr", name: "Turkish", targetable: true },
];

const BIDDING_TYPE_OPTIONS: { value: BiddingType; label: string }[] = [
  { value: "TARGET_CPA", label: "目标 CPA" },
  { value: "MAXIMIZE_CONVERSIONS", label: "尽可能提高转化次数" },
];

const CLICK_BIDDING_TYPE_OPTIONS: { value: ClickBiddingType; label: string }[] = [
  { value: "MAX_CPC", label: "目标 CPC" },
  { value: "MAXIMIZE_CLICKS", label: "尽可能提高点击次数" },
];

const CONVERSION_CATEGORY_LABELS: Record<string, string> = {
  PURCHASE: "购买",
  ADD_TO_CART: "加入购物车",
  BEGIN_CHECKOUT: "开始结账",
  SUBSCRIBE: "订阅",
  SUBMIT_LEAD_FORM: "提交潜在客户表单",
  BOOK_APPOINTMENT: "预约",
  REQUEST_QUOTE: "请求报价",
  GET_DIRECTIONS: "获取路线",
  OUTBOUND_CLICK: "出站点击",
  CONTACT: "联系",
  ENGAGEMENT: "互动",
  PAGE_VIEW: "页面浏览",
  SIGNUP: "注册",
  DOWNLOAD: "下载",
};

const CTA_OPTIONS = [
  ["AUTO", "（自动）"],
  ["APPLY_NOW", "立即申请"],
  ["BOOK_NOW", "立即预订"],
  ["SHOP_NOW", "立即购买"],
  ["CONTACT_US", "联系我们"],
  ["DONATE_NOW", "立即捐款"],
  ["DOWNLOAD", "下载"],
  ["GET_STARTED", "立即开始"],
  ["SUBSCRIBE", "订阅"],
  ["VISIT_SITE", "访问网站"],
  ["WATCH_NOW", "立即观看"],
  ["LEARN_MORE", "了解详情"],
  ["SIGN_UP", "注册"],
  ["GET_QUOTE", "获取报价"],
];

const OBJECTIVE_OPTIONS = [
  { value: "CONVERSIONS", label: "转化" },
  { value: "CLICKS", label: "点击次数" },
];

const DEFAULT_CHANNELS = {
  youtubeInFeed: true,
  youtubeInStream: true,
  youtubeShorts: true,
  discover: true,
  gmail: true,
  display: true,
};

const SCHEDULE_DAYS = [
  { key: "MONDAY", label: "周一" },
  { key: "TUESDAY", label: "周二" },
  { key: "WEDNESDAY", label: "周三" },
  { key: "THURSDAY", label: "周四" },
  { key: "FRIDAY", label: "周五" },
  { key: "SATURDAY", label: "周六" },
  { key: "SUNDAY", label: "周日" },
];

const SCHEDULE_HOURS = Array.from({ length: 24 }, (_, index) => index);

function formatConversionGoalLabel(goal: ConversionGoalPoint) {
  const category = CONVERSION_CATEGORY_LABELS[goal.category] ?? goal.category;
  return `${category} · ${goal.actionCount} 个操作`;
}

function defaultBiddingForObjective(objective: string) {
  if (objective === "CLICKS") {
    return { clickBiddingType: "MAX_CPC" as ClickBiddingType };
  }
  return { biddingType: "TARGET_CPA" as BiddingType };
}

function summarizeGeoLocation(
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

function summarizeLanguageValue(
  language: string,
  languageTargets: LanguageTargetOption[] = FALLBACK_LANGUAGE_OPTIONS,
) {
  if (!language || language === "all") {
    return "所有语言";
  }
  const match = languageTargets.find((item) => item.resourceName === language);
  return match ? languageTargetLabel(match) : language;
}

function summarizeOsDevice(os: string, device: string) {
  const osLabel = OS_OPTIONS.find((option) => option.value === os)?.label ?? os;
  const deviceLabel = DEVICE_OPTIONS.find((option) => option.value === device)?.label ?? device;
  return `${osLabel} / ${deviceLabel}`;
}

function summarizeScheduleBrief(schedule: ScheduleGridValue) {
  const allDaysEnabled = SCHEDULE_DAYS.every((day) =>
    (schedule[day.key] ?? []).every(Boolean),
  );
  if (allDaysEnabled) {
    return "全天投放";
  }
  const formatted = formatSchedule(schedule);
  return formatted.length > 28 ? `${formatted.slice(0, 28)}…` : formatted;
}

function buildCampaignHighlights(
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

  highlights.push(`定向 ${summarizeOsDevice(campaign.os, campaign.device)}`);
  highlights.push(`投放 ${summarizeScheduleBrief(campaign.adSchedule)}`);

  if (campaign.campaignObjective === "CONVERSIONS" && campaign.conversionGoal) {
    const goalLabel =
      CONVERSION_CATEGORY_LABELS[campaign.conversionGoal] ?? campaign.conversionGoal;
    highlights.push(`转化目标 ${goalLabel}`);
  }

  return highlights.slice(0, 7);
}

function buildCampaignOverviewMeta(
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
      summary: `${group.ads.length} ads`,
      ads: group.ads.map((ad) => ({
        id: ad.id,
        name: ad.name,
        summary: `${splitLines(ad.shortHeadlines).length} headlines`,
      })),
    })),
  };
}

function buildDefaultSchedule() {
  return Object.fromEntries(
    SCHEDULE_DAYS.map((day) => [day.key, SCHEDULE_HOURS.map(() => true)]),
  ) as ScheduleGridValue;
}

function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function summarizeAdGroupCard(group: AdGroupForm) {
  const locationLabel = splitLines(group.locations)[0] || "未设地理位置";
  return `${group.ads.length} 条广告 · ${group.language || "未设语言"} · ${locationLabel}`;
}

function summarizeAdCard(ad: AdForm) {
  return `${splitLines(ad.shortHeadlines).length} 标题 · ${splitLines(ad.videoLinks).length} 视频 · ${ad.businessName || "未填商家名"}`;
}

type EditorFocus =
  | { level: "adgroup"; campaignId: string; groupId: string }
  | { level: "ad"; campaignId: string; groupId: string; adId: string };

/** Data URLs contain commas — only split on newlines. */
function splitMultiline(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinMultiline(values: string[]) {
  return values.join("\n");
}

function normalizeVideoInputs(value: string) {
  return splitLines(value)
    .map((item) => youtubeVideoIdFromInput(item))
    .filter((videoId): videoId is string => Boolean(videoId));
}

function youtubeVideoIdFromInput(value: string) {
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

function youtubeThumbnailUrl(value: string) {
  const videoId = youtubeVideoIdFromInput(value);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("读取文件失败。"));
    reader.readAsDataURL(file);
  });
}

function microsFromAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 1_000_000;
  }
  return Math.round(amount * 1_000_000);
}

function buildBiddingPayload(form: CampaignForm) {
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

function geoTargetLabel(target: GeoTargetOption) {
  return target.countryCode || target.name || target.canonicalName || target.resourceName;
}

function languageTargetLabel(language: LanguageTargetOption) {
  if (language.resourceName === "all") {
    return "所有语言";
  }
  return language.name || language.code || language.resourceName;
}

function buildGeoTargetSelectOptions(
  geoTargets: GeoTargetOption[],
  activeLocation?: string,
): ComboboxOption[] {
  const options = geoTargets.map((target) => ({
    value: target.resourceName,
    label: geoTargetLabel(target),
    keywords: [target.name, target.canonicalName, target.countryCode, target.targetType],
  }));

  if (activeLocation && !options.some((option) => option.value === activeLocation)) {
    options.unshift({ value: activeLocation, label: activeLocation, keywords: [] });
  }

  return options;
}

function buildLanguageTargetSelectOptions(
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

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function rangesFromHours(hours: boolean[]) {
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

function formatSchedule(schedule: ScheduleGridValue) {
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

function createDefaultAd(index = 1): AdForm {
  return {
    id: `ad_${index}`,
    name: `广告 ${index}`,
    finalUrl: "https://example.com/landing",
    videoLinks: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    logos: "",
    shortHeadlines: "Official Site\nNew Deals Today\nShop Securely",
    longHeadlines: "Discover better products on the official website",
    descriptions:
      "Browse new arrivals and complete checkout online.\nTrusted service, fresh deals, and fast checkout.",
    callToAction: "SHOP_NOW",
    businessName: "Apex",
  };
}

function createDefaultAdGroup(index = 1): AdGroupForm {
  return {
    id: `adg_${index}`,
    name: `广告组 ${index}`,
    locations: "geoTargetConstants/2840",
    audienceSignals: "网站访客, 加购用户, 高意向购买人群",
    language: "all",
    genders: ["FEMALE", "MALE", "UNDETERMINED"],
    ageMin: "18",
    ageMax: "65",
    includeUnknownAge: true,
    ads: [createDefaultAd(1)],
  };
}

function buildDefaultCampaign(index: number, account?: GoogleAdAccount): CampaignForm {
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
    os: "all",
    device: "all",
    adSchedule: buildDefaultSchedule(),
    trackingTemplate: "",
    finalUrlSuffix: "gad_campaignid={campaignid}",
    ipExclusions: "",
    adGroups: [createDefaultAdGroup(1)],
  };
}

function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`grid min-w-0 gap-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

type ModalHierarchyItem = {
  label: string;
  name: string;
};

let bodyScrollLockCount = 0;

function lockPageScroll() {
  bodyScrollLockCount += 1;
  if (bodyScrollLockCount !== 1 || typeof document === "undefined") {
    return;
  }

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockPageScroll() {
  if (typeof document === "undefined") {
    return;
  }

  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount !== 0) {
    return;
  }

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

function usePageScrollLock() {
  useEffect(() => {
    lockPageScroll();
    return unlockPageScroll;
  }, []);
}

function ModalHierarchyTrail({ items }: { items: ModalHierarchyItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol
      aria-label="当前层级"
      className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-snug"
    >
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex min-w-0 max-w-full items-center gap-1">
          {index > 0 ? (
            <ChevronRight
              aria-hidden
              className="h-3 w-3 shrink-0 text-[var(--muted)]"
              strokeWidth={1.75}
            />
          ) : null}
          <span className="shrink-0 text-[var(--muted)]">{item.label}:</span>
          <span className="truncate font-medium text-[var(--ink)]" title={item.name}>
            {item.name}
          </span>
        </li>
      ))}
    </ol>
  );
}

function BuilderModalContent({
  title,
  eyebrow,
  hierarchyTrail,
  children,
  onClose,
  onBack,
  zIndexClassName = "z-50",
  maxWidthClassName = "max-w-6xl",
}: {
  title: string;
  eyebrow: string;
  hierarchyTrail?: ModalHierarchyItem[];
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  zIndexClassName?: string;
  maxWidthClassName?: string;
}) {
  usePageScrollLock();

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:p-6 ${zIndexClassName}`}
    >
      <button
        aria-label="关闭弹窗"
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />
      <section
        aria-modal="true"
        className={`relative max-h-[88vh] w-full overflow-hidden rounded-[2rem] border border-[var(--hairline)] bg-[var(--surface-card)] shadow-[0_24px_80px_rgba(15,23,42,0.24)] ${maxWidthClassName}`}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <ModalHierarchyTrail items={hierarchyTrail ?? []} />
            <p className="text-caption-uppercase text-[var(--muted)]">{eyebrow}</p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              {title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onBack ? (
              <Button size="sm" type="button" variant="ghost" onClick={onBack}>
                返回
              </Button>
            ) : null}
            <Button size="sm" type="button" variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(88vh-5rem)] overflow-auto p-4 sm:p-5">{children}</div>
      </section>
    </div>
  );
}

function BuilderModal(props: {
  title: string;
  eyebrow: string;
  hierarchyTrail?: ModalHierarchyItem[];
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  zIndexClassName?: string;
  maxWidthClassName?: string;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(<BuilderModalContent {...props} />, document.body);
}

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function SelectControl({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select disabled={disabled} value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} disabled={option.disabled} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TextList({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Textarea
      className="min-h-20"
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function AssetInputList({
  value,
  onChange,
  maxItems = 5,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  maxItems?: number;
  maxLength: number;
  placeholder: string;
}) {
  const [draftItems, setDraftItems] = useState<string[]>(() => {
    const items = splitLines(value).slice(0, maxItems);
    return items.length ? items : [""];
  });

  function commit(nextItems: string[]) {
    setDraftItems(nextItems);
    onChange(joinLines(nextItems.filter((item) => item.trim())));
  }

  function updateItem(index: number, nextValue: string) {
    const nextItems = [...draftItems];
    nextItems[index] = nextValue;
    commit(nextItems);
  }

  function addItem() {
    if (draftItems.length >= maxItems) {
      return;
    }
    commit([...draftItems, ""]);
  }

  function removeItem(index: number) {
    const nextItems = draftItems.filter((_, itemIndex) => itemIndex !== index);
    commit(nextItems.length ? nextItems : [""]);
  }

  return (
    <div className="grid gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">最多可添加 {maxItems} 条</p>
        <Button
          className="h-7 px-2.5 text-xs"
          disabled={draftItems.length >= maxItems}
          size="sm"
          type="button"
          variant="outline"
          onClick={addItem}
        >
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          添加
        </Button>
      </div>
      <div className="grid gap-2">
        {draftItems.map((item, index) => (
          <div key={index} className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Input
                maxLength={maxLength}
                placeholder={placeholder}
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
              />
              <Button
                aria-label="删除"
                className="h-10 w-10 shrink-0 rounded-lg px-0"
                disabled={draftItems.length === 1}
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
            <p className="text-right text-xs text-[var(--muted)]">
              {item.length}/{maxLength}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoLinkList({
  value,
  onChange,
  maxItems = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  maxItems?: number;
}) {
  const [draftItems, setDraftItems] = useState<string[]>(() => {
    const items = splitLines(value).slice(0, maxItems);
    return items.length ? items : [""];
  });

  function commit(nextItems: string[]) {
    setDraftItems(nextItems);
    onChange(joinLines(nextItems.filter((item) => item.trim())));
  }

  function updateItem(index: number, nextValue: string) {
    const nextItems = [...draftItems];
    nextItems[index] = nextValue;
    commit(nextItems);
  }

  function addItem() {
    if (draftItems.length >= maxItems) {
      return;
    }
    commit([...draftItems, ""]);
  }

  function removeItem(index: number) {
    const nextItems = draftItems.filter((_, itemIndex) => itemIndex !== index);
    commit(nextItems.length ? nextItems : [""]);
  }

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted)]">最多 {maxItems} 条 · watch / youtu.be 链接</p>
          <Button
            className="shrink-0 whitespace-nowrap"
            disabled={draftItems.length >= maxItems}
            size="sm"
            type="button"
            variant="outline"
            onClick={addItem}
          >
            <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            添加
          </Button>
        </div>

        <ul className="divide-y divide-[var(--hairline)]">
          {draftItems.map((item, index) => {
            const thumbnailUrl = youtubeThumbnailUrl(item);
            const videoId = youtubeVideoIdFromInput(item);

            return (
              <li key={index} className="p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--ink)]">视频 {index + 1}</span>
                  <Button
                    aria-label={`删除视频 ${index + 1}`}
                    className="h-7 w-7 shrink-0 rounded-md px-0"
                    disabled={draftItems.length === 1}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {thumbnailUrl ? (
                    <Image
                      alt="视频封面"
                      className="h-[4.5rem] w-full shrink-0 rounded-lg border border-[var(--hairline)] object-cover sm:w-32"
                      height={90}
                      src={thumbnailUrl}
                      unoptimized
                      width={160}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-[4.5rem] w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-strong)] sm:w-32"
                    >
                      <Video className="h-5 w-5 text-[var(--muted-soft)]" strokeWidth={1.75} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <Textarea
                      className="min-h-[3.25rem] resize-y py-2.5 text-sm leading-relaxed"
                      placeholder="https://www.youtube.com/watch?v=..."
                      rows={2}
                      spellCheck={false}
                      value={item}
                      onChange={(event) => updateItem(index, event.target.value)}
                    />
                    {thumbnailUrl && videoId ? (
                      <p className="text-xs leading-relaxed text-[var(--muted)]">
                        已识别视频 ID{" "}
                        <code className="rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink)]">
                          {videoId}
                        </code>
                      </p>
                    ) : item.trim() ? (
                      <p className="text-xs text-[var(--semantic-error)]">
                        链接无效，请输入完整 YouTube 地址
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LogoUploadList({
  value,
  onChange,
  maxItems = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  maxItems?: number;
}) {
  const items = splitMultiline(value).slice(0, maxItems);

  async function addFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const remaining = Math.max(maxItems - items.length, 0);
    const selectedFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);
    const dataUrls = await Promise.all(selectedFiles.map(fileToDataUrl));
    onChange(joinMultiline([...items, ...dataUrls]));
  }

  function removeItem(index: number) {
    onChange(joinMultiline(items.filter((_, itemIndex) => itemIndex !== index)));
  }

  const canUploadMore = items.length < maxItems;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
      <div className="border-b border-[var(--hairline)] px-3 py-2.5">
        <p className="text-xs text-[var(--muted)]">
          {items.length}/{maxItems} 张 · PNG / JPG / WebP
        </p>
      </div>

      {items.length === 0 && canUploadMore ? (
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center transition hover:bg-[var(--surface-strong)]">
          <Plus aria-hidden className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.75} />
          <span className="text-sm font-medium text-[var(--ink)]">上传徽标图片</span>
          <span className="text-xs text-[var(--muted)]">点击选择本地图片</span>
          <input
            accept="image/*"
            className="sr-only"
            multiple
            type="file"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      ) : (
        <div className="flex flex-wrap gap-3 p-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-strong)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`徽标 ${index + 1}`}
                className="h-full w-full object-contain p-1.5"
                src={item}
              />
              <button
                aria-label={`删除徽标 ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--canvas)]/95 opacity-0 shadow-sm transition hover:bg-[var(--surface-card)] group-hover:opacity-100 group-focus-within:opacity-100"
                type="button"
                onClick={() => removeItem(index)}
              >
                <Trash2 aria-hidden className="h-3 w-3 text-[var(--ink)]" strokeWidth={1.75} />
              </button>
            </div>
          ))}

          {canUploadMore ? (
            <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-strong)] transition hover:border-[var(--ink)]/30 hover:bg-[var(--surface-card)]">
              <Plus aria-hidden className="h-4 w-4 text-[var(--ink)]" strokeWidth={1.75} />
              <span className="text-[10px] text-[var(--muted)]">上传</span>
              <input
                accept="image/*"
                className="sr-only"
                multiple
                type="file"
                onChange={(event) => {
                  void addFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      )}

      {!canUploadMore && items.length > 0 ? (
        <p className="border-t border-[var(--hairline)] px-3 py-2 text-center text-xs text-[var(--muted)]">
          已达上限 {maxItems} 张
        </p>
      ) : null}
    </div>
  );
}

function NumberStepperControl({
  value,
  min,
  step,
  onChange,
}: {
  value: string;
  min: number;
  step: number;
  onChange: (value: string) => void;
}) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : min;

  function applyDelta(delta: number) {
    const next = Math.max(min, safeValue + delta);
    onChange(Number.isInteger(step) ? String(Math.round(next)) : next.toFixed(1));
  }

  return (
    <div className="grid h-10 grid-cols-[36px_minmax(0,1fr)_36px] overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)]">
      <button
        className="border-r border-[var(--hairline)] text-base text-[var(--body)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
        type="button"
        onClick={() => applyDelta(-step)}
      >
        -
      </button>
      <input
        className="min-w-0 bg-transparent px-3 text-center text-sm text-[var(--ink)] outline-none"
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        className="border-l border-[var(--hairline)] text-base text-[var(--body)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
        type="button"
        onClick={() => applyDelta(step)}
      >
        +
      </button>
    </div>
  );
}

function TimeSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const updatePanelPosition = useCallback(() => {
    if (!rootRef.current) {
      return;
    }

    const rect = rootRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const panelWidth = 288;
    const rowHeight = 38;
    const panelHeight = Math.ceil(options.length / 4) * rowHeight + 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const opensAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    const top = opensAbove
      ? Math.max(viewportPadding, rect.top - panelHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - viewportPadding - panelHeight);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - viewportPadding - panelWidth,
    );

    setPanelStyle({
      left,
      top: Math.max(viewportPadding, top),
      width: panelWidth,
    });
  }, [options.length]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  return (
    <div ref={rootRef} className="relative">
      <button
        className={`flex h-9 min-w-[6.5rem] items-center justify-between rounded-lg border px-3 text-sm font-medium text-[var(--ink)] transition ${
          open
            ? "border-[var(--ink)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]"
            : "border-[var(--hairline-strong)] bg-[var(--surface-card)] hover:border-[var(--ink)]/35"
        }`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 text-[var(--body)] transition ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      {open && panelStyle
        ? createPortal(
        <div
          ref={panelRef}
          className="fixed z-[1000] rounded-2xl border border-[var(--hairline-strong)] bg-[var(--surface-card)] p-1.5 shadow-[var(--shadow-elevated)]"
          style={panelStyle}
        >
          <div className="grid grid-cols-4 gap-1">
          {options.map((option) => (
            <button
              key={option}
              className={`flex h-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition ${
                option === value
                  ? "bg-[var(--ink)] text-[var(--on-primary)]"
                  : "text-[var(--ink)] hover:bg-[var(--surface-strong)]"
              }`}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

function SchedulePicker({
  value,
  onChange,
}: {
  value: ScheduleGridValue;
  onChange: (value: ScheduleGridValue) => void;
}) {
  const [clipboard, setClipboard] = useState<boolean[] | null>(null);
  const [clipboardDay, setClipboardDay] = useState<string | null>(null);
  const [mode, setMode] = useState<"day" | "week">("day");
  const [rangeStart, setRangeStart] = useState("0");
  const [rangeEnd, setRangeEnd] = useState("24");
  const [preview, setPreview] = useState<{ dayKey: string; hour: number } | null>(null);

  function updateDay(dayKey: string, hours: boolean[]) {
    onChange({ ...value, [dayKey]: hours });
  }

  function selectUntilHour(dayKey: string, hour: number) {
    const current = value[dayKey] ?? SCHEDULE_HOURS.map(() => false);
    updateDay(
      dayKey,
      current.map((_enabled, index) => index <= hour),
    );
  }

  function clearDay(dayKey: string) {
    updateDay(dayKey, SCHEDULE_HOURS.map(() => false));
  }

  function pasteDay(dayKey: string) {
    if (!clipboard) {
      return;
    }
    updateDay(dayKey, [...clipboard]);
  }

  function applyWeekRange() {
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    const nextHours = SCHEDULE_HOURS.map((hour) => end > start && hour >= start && hour < end);

    onChange(Object.fromEntries(SCHEDULE_DAYS.map((day) => [day.key, nextHours])) as ScheduleGridValue);
  }

  const hourOptions = Array.from({ length: 25 }, (_, hour) => hour);
  return (
    <div className="relative overflow-visible rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="mb-1.5 grid grid-cols-[auto_1fr_4.75rem] items-end gap-2">
            <div />
            <div className="grid grid-cols-7 text-center text-[11px] text-[var(--muted)]">
              {[3, 6, 9, 12, 15, 18, 21].map((hour) => (
                <span key={hour}>{formatHour(hour)}</span>
              ))}
            </div>
            <div />
          </div>

          <div className="space-y-1.5">
            {SCHEDULE_DAYS.map((day) => {
              const hours = value[day.key] ?? SCHEDULE_HOURS.map(() => false);
              const hasCopiedOtherDay = Boolean(clipboard && clipboardDay !== day.key);

              return (
                <div key={day.key} className="grid grid-cols-[auto_1fr_4.75rem] items-center gap-2">
                  <span className="whitespace-nowrap text-right text-[11px] font-semibold text-[var(--muted)]">
                    {day.label}
                  </span>
                  <div
                    className="grid h-5 overflow-hidden rounded-md border border-[var(--hairline)]"
                    style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
                    onMouseLeave={() => setPreview(null)}
                  >
                    {hours.map((enabled, hour) => {
                      const previewed = preview?.dayKey === day.key && hour <= preview.hour;

                      return (
                        <button
                          key={hour}
                          aria-label={`${day.label} ${formatHour(hour)}`}
                          className={`border-r border-[var(--hairline)] transition-colors last:border-r-0 ${
                            enabled
                              ? "bg-[var(--body)]"
                              : previewed
                                ? "bg-[var(--muted-soft)]"
                                : "bg-[var(--surface-strong)]"
                          }`}
                          type="button"
                          onClick={() => selectUntilHour(day.key, hour)}
                          onMouseEnter={() => setPreview({ dayKey: day.key, hour })}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      className="h-6 min-w-[2.25rem] px-1.5 text-[11px]"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => clearDay(day.key)}
                    >
                      清空
                    </Button>
                    <Button
                      className="h-6 min-w-[2.25rem] px-1.5 text-[11px]"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (hasCopiedOtherDay) {
                          pasteDay(day.key);
                          return;
                        }
                        setClipboard([...hours]);
                        setClipboardDay(day.key);
                      }}
                    >
                      {hasCopiedOtherDay ? "粘贴" : "复制"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr_4.75rem] items-center gap-2">
        <Label className="whitespace-nowrap text-right text-xs normal-case tracking-normal text-[var(--body-strong)]">
          时间范围
        </Label>
        <div className="col-span-2 flex min-w-0 flex-nowrap items-center gap-2.5">
          <div className="inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)] p-0.5">
            <button
              className={`h-7 rounded-full px-3 text-xs font-medium transition ${
                mode === "day"
                  ? "bg-[var(--ink)] text-[var(--on-primary)]"
                  : "text-[var(--body)] hover:text-[var(--ink)]"
              }`}
              type="button"
              onClick={() => setMode("day")}
            >
              按天
            </button>
            <button
              className={`h-7 rounded-full px-3 text-xs font-medium transition ${
                mode === "week"
                  ? "bg-[var(--ink)] text-[var(--on-primary)]"
                  : "text-[var(--body)] hover:text-[var(--ink)]"
              }`}
              type="button"
              onClick={() => setMode("week")}
            >
              按周
            </button>
          </div>
          {mode === "week" ? (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">
              <TimeSelect
                options={hourOptions.slice(0, 24).map((hour) => formatHour(hour))}
                value={formatHour(Number(rangeStart))}
                onChange={(next) => setRangeStart(String(Number(next.slice(0, 2))))}
              />
              <TimeSelect
                options={hourOptions.slice(1).map((hour) => formatHour(hour))}
                value={formatHour(Number(rangeEnd))}
                onChange={(next) => setRangeEnd(String(Number(next.slice(0, 2))))}
              />
              <Button
                className="flex h-9 items-center justify-center rounded-lg px-3 text-sm"
                type="button"
                variant="outline"
                onClick={applyWeekRange}
              >
                应用
              </Button>
            </div>
          ) : null}
          <p className="shrink-0 whitespace-nowrap text-[11px] text-[var(--muted)]">
            {mode === "week" ? "按周会覆盖全部日期" : "按天直接在图表点选"}
          </p>
        </div>
      </div>
    </div>
  );
}

function buildPayloadFromCampaign(campaign: CampaignForm, firstAdFallback: AdForm) {
  const adGroups = campaign.adGroups.map((group) => ({
    id: group.id,
    name: group.name,
    locations: splitLines(group.locations),
    audienceSignals: splitLines(group.audienceSignals),
    language: group.language,
    demographics: {
      genders: group.genders,
      ageRange: {
        min: group.ageMin,
        max: group.ageMax,
        includeUnknown: group.includeUnknownAge,
      },
    },
    selectedChannels: DEFAULT_CHANNELS,
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
  const selectedDevices = campaign.device === "all" ? [] : [campaign.device];
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
    locations: primaryAdGroup?.locations.length ? primaryAdGroup.locations : ["US"],
    language: primaryAdGroup?.language ?? "zh-CN",
    os: campaign.os,
    device: campaign.device,
    devices: selectedDevices,
    adSchedule: formatSchedule(campaign.adSchedule),
    urlPrefix: campaign.finalUrlSuffix,
    trackingTemplate: campaign.trackingTemplate || undefined,
    finalUrlSuffix: campaign.finalUrlSuffix,
    ipExclusions: splitLines(campaign.ipExclusions),
    assets: {
      headlines: primaryAd?.headlines ?? [],
      longHeadlines: primaryAd?.longHeadlines ?? [],
      descriptions: primaryAd?.descriptions ?? [],
      businessName: primaryAd?.businessName ?? firstAdFallback.businessName,
      marketingImages: [],
      squareMarketingImages: [],
      logos: primaryAd?.logos ?? [],
      youtubeVideos: primaryAd?.youtubeVideos ?? [],
    },
    demandGen: {
      adGroupName: primaryAdGroup?.name ?? "Main Ad Group",
      selectedChannels: DEFAULT_CHANNELS,
    },
    adGroups,
  };
}

export function LaunchBuilder({
  initialAdAccounts,
  accountSyncError: initialSyncError = null,
  accountsSyncedAt: initialSyncedAt = null,
  initialMccAccounts = [],
}: LaunchBuilderProps) {
  const [adAccounts, setAdAccounts] = useState(initialAdAccounts);
  const [mccAccounts, setMccAccounts] = useState<GoogleMccAccount[]>(initialMccAccounts);
  const [syncState, setSyncState] = useState<"idle" | "loaded" | "loading" | "success" | "error">(() => {
    if (initialSyncError) {
      return "error";
    }
    if (initialAdAccounts.length > 0) {
      return "loaded";
    }
    return "idle";
  });
  const [syncError, setSyncError] = useState<string | null>(initialSyncError);
  const [syncedAt, setSyncedAt] = useState<string | null>(initialSyncedAt);

  const firstAccount = adAccounts[0];
  const initialCampaignIdRef = useRef(`cmp_1_${Date.now()}`);
  const [campaigns, setCampaigns] = useState<CampaignForm[]>(() => {
    const initial = {
      ...buildDefaultCampaign(1, firstAccount),
      id: initialCampaignIdRef.current,
    };
    return [initial];
  });
  const [expandByCampaign, setExpandByCampaign] = useState<Record<string, ExpandState>>(() => {
    const initial = buildDefaultCampaign(1, firstAccount);
    return {
      [initialCampaignIdRef.current]: buildInitialExpandState(initial.adGroups),
    };
  });
  const [result, setResult] = useState<ApiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversionGoalsByAccount, setConversionGoalsByAccount] = useState<
    Record<string, ConversionGoalPoint[]>
  >({});
  const [conversionGoalStateByAccount, setConversionGoalStateByAccount] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({});
  const [conversionGoalErrorByAccount, setConversionGoalErrorByAccount] = useState<
    Record<string, string | null>
  >({});
  const [geoTargetsByAccount, setGeoTargetsByAccount] = useState<
    Record<string, GeoTargetOption[]>
  >({});
  const [geoTargetStateByAccount, setGeoTargetStateByAccount] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({});
  const [geoTargetErrorByAccount, setGeoTargetErrorByAccount] = useState<
    Record<string, string | null>
  >({});
  const [languageTargetsByAccount, setLanguageTargetsByAccount] = useState<
    Record<string, LanguageTargetOption[]>
  >({});
  const [languageTargetStateByAccount, setLanguageTargetStateByAccount] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({});
  const [languageTargetErrorByAccount, setLanguageTargetErrorByAccount] = useState<
    Record<string, string | null>
  >({});
  const idCounterRef = useRef(2);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [editorFocus, setEditorFocus] = useState<EditorFocus | null>(null);
  const [previewCampaignId, setPreviewCampaignId] = useState<string | null>(null);

  function closeCampaignEditor() {
    setActiveCampaignId(null);
    setEditorFocus(null);
  }

  function clearEditorFocusForGroup(campaignId: string, groupId: string) {
    setEditorFocus((current) => {
      if (!current || current.campaignId !== campaignId) {
        return current;
      }
      if (current.level === "adgroup" && current.groupId === groupId) {
        return null;
      }
      if (current.level === "ad" && current.groupId === groupId) {
        return null;
      }
      return current;
    });
  }

  function clearEditorFocusForAd(campaignId: string, groupId: string, adId: string) {
    setEditorFocus((current) => {
      if (
        current?.level === "ad" &&
        current.campaignId === campaignId &&
        current.groupId === groupId &&
        current.adId === adId
      ) {
        return { level: "adgroup", campaignId, groupId };
      }
      return current;
    });
  }

  const accountIdsKey = useMemo(
    () =>
      [...new Set(campaigns.map((campaign) => campaign.adAccountId).filter(Boolean))]
        .sort()
        .join(","),
    [campaigns],
  );

  function patchCampaign(campaignId: string, patch: Partial<CampaignForm>) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId ? { ...campaign, ...patch } : campaign,
      ),
    );
  }

  const loadConversionGoals = useCallback(
    async (campaignId: string, adAccountId: string) => {
      if (!adAccountId) {
        setConversionGoalsByAccount((current) => ({ ...current, [adAccountId]: [] }));
        setConversionGoalStateByAccount((current) => ({ ...current, [adAccountId]: "idle" }));
        setConversionGoalErrorByAccount((current) => ({ ...current, [adAccountId]: null }));
        return;
      }

      setConversionGoalStateByAccount((current) => ({ ...current, [adAccountId]: "loading" }));
      setConversionGoalErrorByAccount((current) => ({ ...current, [adAccountId]: null }));

      try {
        const account = adAccounts.find((item) => item.id === adAccountId);
        const params = new URLSearchParams();
        if (account?.customerId) {
          params.set("customerId", account.customerId);
        }
        const accountLoginCustomerId =
          account?.loginCustomerId ??
          mccAccounts.find((mcc) => mcc.id === account?.operationMccId)?.customerId;
        if (accountLoginCustomerId) {
          params.set("loginCustomerId", accountLoginCustomerId);
        }

        const response = await fetch(
          `/api/google-ads/accounts/${adAccountId}/conversion-goals?${params.toString()}`,
        );
        const json = (await response.json()) as ApiResult;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message ?? "读取真实转化目标失败。");
        }

        const goals = json.data as ConversionGoalPoint[];
        setConversionGoalsByAccount((current) => ({ ...current, [adAccountId]: goals }));
        patchCampaign(campaignId, { conversionGoal: goals[0]?.id ?? "" });
        setConversionGoalStateByAccount((current) => ({ ...current, [adAccountId]: "success" }));
      } catch (error) {
        setConversionGoalStateByAccount((current) => ({ ...current, [adAccountId]: "error" }));
        setConversionGoalsByAccount((current) => ({ ...current, [adAccountId]: [] }));
        setConversionGoalErrorByAccount((current) => ({
          ...current,
          [adAccountId]: error instanceof Error ? error.message : "读取真实转化目标失败。",
        }));
      }
    },
    [adAccounts, mccAccounts],
  );

  const loadGeoTargets = useCallback(
    async (adAccountId: string) => {
      if (!adAccountId) {
        setGeoTargetsByAccount((current) => ({
          ...current,
          [adAccountId]: FALLBACK_GEO_TARGET_OPTIONS,
        }));
        setGeoTargetStateByAccount((current) => ({ ...current, [adAccountId]: "idle" }));
        setGeoTargetErrorByAccount((current) => ({ ...current, [adAccountId]: null }));
        return;
      }

      setGeoTargetStateByAccount((current) => ({ ...current, [adAccountId]: "loading" }));
      setGeoTargetErrorByAccount((current) => ({ ...current, [adAccountId]: null }));

      try {
        const account = adAccounts.find((item) => item.id === adAccountId);
        const params = new URLSearchParams();
        if (account?.customerId) {
          params.set("customerId", account.customerId);
        }
        const accountLoginCustomerId =
          account?.loginCustomerId ??
          mccAccounts.find((mcc) => mcc.id === account?.operationMccId)?.customerId;
        if (accountLoginCustomerId) {
          params.set("loginCustomerId", accountLoginCustomerId);
        }

        const response = await fetch(
          `/api/google-ads/accounts/${adAccountId}/geo-targets?${params.toString()}`,
        );
        const json = (await response.json()) as ApiResult;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message ?? "读取地理位置失败。");
        }

        const targets = json.data as GeoTargetOption[];
        setGeoTargetsByAccount((current) => ({
          ...current,
          [adAccountId]: targets.length ? targets : FALLBACK_GEO_TARGET_OPTIONS,
        }));
        setGeoTargetStateByAccount((current) => ({ ...current, [adAccountId]: "success" }));
      } catch (error) {
        setGeoTargetsByAccount((current) => ({
          ...current,
          [adAccountId]: FALLBACK_GEO_TARGET_OPTIONS,
        }));
        setGeoTargetStateByAccount((current) => ({ ...current, [adAccountId]: "error" }));
        setGeoTargetErrorByAccount((current) => ({
          ...current,
          [adAccountId]: error instanceof Error ? error.message : "读取地理位置失败。",
        }));
      }
    },
    [adAccounts, mccAccounts],
  );

  useEffect(() => {
    const accountIds = accountIdsKey ? accountIdsKey.split(",") : [];
    const timeoutId = window.setTimeout(() => {
      for (const adAccountId of accountIds) {
        void loadGeoTargets(adAccountId);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [accountIdsKey, loadGeoTargets]);

  const loadLanguageTargets = useCallback(
    async (adAccountId: string) => {
      if (!adAccountId) {
        setLanguageTargetsByAccount((current) => ({
          ...current,
          [adAccountId]: FALLBACK_LANGUAGE_OPTIONS,
        }));
        setLanguageTargetStateByAccount((current) => ({ ...current, [adAccountId]: "idle" }));
        setLanguageTargetErrorByAccount((current) => ({ ...current, [adAccountId]: null }));
        return;
      }

      setLanguageTargetStateByAccount((current) => ({ ...current, [adAccountId]: "loading" }));
      setLanguageTargetErrorByAccount((current) => ({ ...current, [adAccountId]: null }));

      try {
        const account = adAccounts.find((item) => item.id === adAccountId);
        const params = new URLSearchParams();
        if (account?.customerId) {
          params.set("customerId", account.customerId);
        }
        const accountLoginCustomerId =
          account?.loginCustomerId ??
          mccAccounts.find((mcc) => mcc.id === account?.operationMccId)?.customerId;
        if (accountLoginCustomerId) {
          params.set("loginCustomerId", accountLoginCustomerId);
        }

        const response = await fetch(
          `/api/google-ads/accounts/${adAccountId}/language-targets?${params.toString()}`,
        );
        const json = (await response.json()) as ApiResult;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message ?? "读取语言失败。");
        }

        const languages = json.data as LanguageTargetOption[];
        setLanguageTargetsByAccount((current) => ({
          ...current,
          [adAccountId]: languages.length ? languages : FALLBACK_LANGUAGE_OPTIONS,
        }));
        setLanguageTargetStateByAccount((current) => ({ ...current, [adAccountId]: "success" }));
      } catch (error) {
        setLanguageTargetsByAccount((current) => ({
          ...current,
          [adAccountId]: FALLBACK_LANGUAGE_OPTIONS,
        }));
        setLanguageTargetStateByAccount((current) => ({ ...current, [adAccountId]: "error" }));
        setLanguageTargetErrorByAccount((current) => ({
          ...current,
          [adAccountId]: error instanceof Error ? error.message : "读取语言失败。",
        }));
      }
    },
    [adAccounts, mccAccounts],
  );

  useEffect(() => {
    const accountIds = accountIdsKey ? accountIdsKey.split(",") : [];
    const timeoutId = window.setTimeout(() => {
      for (const adAccountId of accountIds) {
        void loadLanguageTargets(adAccountId);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [accountIdsKey, loadLanguageTargets]);

  const syncGoogleAccounts = useCallback(async () => {
    setSyncState("loading");
    setSyncError(null);

    try {
      const response = await fetch("/api/accounts/sync", { method: "POST" });
      const json = (await response.json()) as ApiResult;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "同步 Google Ads 账号失败。");
      }

      const data = json.data as SyncPayload;
      setMccAccounts(data.mccAccounts);
      setAdAccounts(data.adAccounts);
      setSyncedAt(data.syncedAt);

      setCampaigns((current) =>
        current.map((campaign) => {
          const account =
            data.adAccounts.find((item) => item.id === campaign.adAccountId) ??
            data.adAccounts[0];
          if (!account) {
            return campaign;
          }
          return { ...campaign, adAccountId: account.id };
        }),
      );

      setSyncState("success");
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "同步 Google Ads 账号失败。");
    }
  }, []);

  function updateCampaignAdGroup(
    campaignId: string,
    groupId: string,
    patch: Partial<AdGroupForm>,
  ) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              adGroups: campaign.adGroups.map((group) =>
                group.id === groupId ? { ...group, ...patch } : group,
              ),
            }
          : campaign,
      ),
    );
  }

  function updateCampaignAd(
    campaignId: string,
    groupId: string,
    adId: string,
    patch: Partial<AdForm>,
  ) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              adGroups: campaign.adGroups.map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      ads: group.ads.map((ad) => (ad.id === adId ? { ...ad, ...patch } : ad)),
                    }
                  : group,
              ),
            }
          : campaign,
      ),
    );
  }

  function expandHierarchy(campaignId: string, groupId: string, adId: string) {
    setExpandByCampaign((current) => ({
      ...current,
      [campaignId]: {
        campaign: true,
        adGroups: { ...current[campaignId]?.adGroups, [groupId]: true },
        ads: { ...current[campaignId]?.ads, [adId]: true },
      },
    }));
  }

  function toggleAdGroupGender(
    campaignId: string,
    group: AdGroupForm,
    gender: string,
    checked: boolean,
  ) {
    const genders = checked
      ? Array.from(new Set([...group.genders, gender]))
      : group.genders.filter((item) => item !== gender);

    updateCampaignAdGroup(campaignId, group.id, { genders });
  }

  function openCampaignDetail(campaignId: string) {
    const campaign = campaigns.find((item) => item.id === campaignId);
    if (!campaign) {
      return;
    }

    setActiveCampaignId(campaignId);
    setExpandByCampaign((current) => ({
      ...current,
      [campaignId]: {
        campaign: true,
        adGroups: Object.fromEntries(campaign.adGroups.map((group) => [group.id, false])),
        ads: Object.fromEntries(
          campaign.adGroups.flatMap((group) => group.ads.map((ad) => [ad.id, false])),
        ),
      },
    }));
  }

  function addCampaign() {
    const nextIndex = campaigns.length + 1;
    const id = `cmp_${nextIndex}_${idCounterRef.current++}`;
    const nextCampaign = { ...buildDefaultCampaign(nextIndex, firstAccount), id };

    setCampaigns((current) => [...current, nextCampaign]);
    setExpandByCampaign((current) => ({
      ...current,
      [id]: buildInitialExpandState(nextCampaign.adGroups),
    }));
    openCampaignDetail(id);
  }

  function removeCampaign(campaignId: string) {
    if (campaigns.length === 1) {
      return;
    }

    setCampaigns((current) => current.filter((campaign) => campaign.id !== campaignId));
    setExpandByCampaign((current) => {
      const next = { ...current };
      delete next[campaignId];
      return next;
    });
    if (activeCampaignId === campaignId) {
      closeCampaignEditor();
    }
  }

  function addAdGroup(campaignId: string) {
    const campaign = campaigns.find((item) => item.id === campaignId);
    if (!campaign) {
      return;
    }

    const id = `adg_${campaign.adGroups.length + 1}_${idCounterRef.current++}`;
    const nextGroup = {
      ...createDefaultAdGroup(campaign.adGroups.length + 1),
      id,
      ads: [{ ...createDefaultAd(1), id: `${id}_ad_1` }],
    };

    patchCampaign(campaignId, { adGroups: [...campaign.adGroups, nextGroup] });
    setExpandByCampaign((current) => ({
      ...current,
      [campaignId]: {
        campaign: true,
        adGroups: { ...current[campaignId]?.adGroups, [id]: true },
        ads: { ...current[campaignId]?.ads, [nextGroup.ads[0].id]: true },
      },
    }));
  }

  function removeAdGroup(campaignId: string, groupId: string) {
    const campaign = campaigns.find((item) => item.id === campaignId);
    if (!campaign || campaign.adGroups.length === 1) {
      return;
    }

    const removedGroup = campaign.adGroups.find((group) => group.id === groupId);
    patchCampaign(campaignId, {
      adGroups: campaign.adGroups.filter((group) => group.id !== groupId),
    });

    setExpandByCampaign((current) => {
      const nextAdGroups = { ...current[campaignId]?.adGroups };
      delete nextAdGroups[groupId];

      const nextAds = { ...current[campaignId]?.ads };
      for (const ad of removedGroup?.ads ?? []) {
        delete nextAds[ad.id];
      }

      return {
        ...current,
        [campaignId]: { ...current[campaignId], adGroups: nextAdGroups, ads: nextAds },
      };
    });
    clearEditorFocusForGroup(campaignId, groupId);
  }

  function addAd(campaignId: string, groupId: string) {
    const campaign = campaigns.find((item) => item.id === campaignId);
    const group = campaign?.adGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    const id = `${groupId}_ad_${group.ads.length + 1}_${idCounterRef.current++}`;
    const nextAd = {
      ...createDefaultAd(group.ads.length + 1),
      id,
      finalUrl: group.ads[0]?.finalUrl ?? "https://example.com/landing",
    };

    updateCampaignAdGroup(campaignId, groupId, { ads: [...group.ads, nextAd] });
    expandHierarchy(campaignId, groupId, id);
  }

  function removeAd(campaignId: string, groupId: string, adId: string) {
    const campaign = campaigns.find((item) => item.id === campaignId);
    const group = campaign?.adGroups.find((item) => item.id === groupId);
    if (!group || group.ads.length === 1) {
      return;
    }

    updateCampaignAdGroup(campaignId, groupId, {
      ads: group.ads.filter((ad) => ad.id !== adId),
    });

    setExpandByCampaign((current) => {
      const nextAdsState = { ...current[campaignId]?.ads };
      delete nextAdsState[adId];
      return {
        ...current,
        [campaignId]: { ...current[campaignId], ads: nextAdsState },
      };
    });
    clearEditorFocusForAd(campaignId, groupId, adId);
  }

  function getCampaignEditorContext(campaign: CampaignForm) {
    return {
      conversionGoals: conversionGoalsByAccount[campaign.adAccountId] ?? [],
      conversionGoalState: conversionGoalStateByAccount[campaign.adAccountId] ?? "idle",
      conversionGoalError: conversionGoalErrorByAccount[campaign.adAccountId] ?? null,
      geoTargets: geoTargetsByAccount[campaign.adAccountId] ?? FALLBACK_GEO_TARGET_OPTIONS,
      geoTargetState: geoTargetStateByAccount[campaign.adAccountId] ?? "idle",
      geoTargetError: geoTargetErrorByAccount[campaign.adAccountId] ?? null,
      languageTargets:
        languageTargetsByAccount[campaign.adAccountId] ?? FALLBACK_LANGUAGE_OPTIONS,
      languageTargetState: languageTargetStateByAccount[campaign.adAccountId] ?? "idle",
      languageTargetError: languageTargetErrorByAccount[campaign.adAccountId] ?? null,
    };
  }

  function renderCampaignEditor(campaign: CampaignForm) {
          const {
            conversionGoals,
            conversionGoalState,
            conversionGoalError,
            geoTargets,
            geoTargetState,
            geoTargetError,
            languageTargets,
            languageTargetState,
            languageTargetError,
          } = getCampaignEditorContext(campaign);

          return (
            <div className="space-y-5 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3 shadow-[var(--shadow-soft)] sm:p-5">
              <div className="space-y-4">
            <div className={inputGridClassName}>
              <Field label="账户">
                <SelectControl
                  disabled={syncState === "loading" || adAccounts.length === 0}
                  options={adAccounts.map((account) => ({
                    value: account.id,
                    label: `${account.name} · ${account.customerId}`,
                  }))}
                  placeholder="请选择账号"
                  value={campaign.adAccountId}
                  onChange={(adAccountId) => {
                    patchCampaign(campaign.id, { adAccountId, conversionGoal: "" });
                  }}
                />
              </Field>
              <Field label="广告系列名称">
                <Input
                  value={campaign.campaignName}
                  onChange={(event) =>
                    patchCampaign(campaign.id, { campaignName: event.target.value })
                  }
                />
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field label="广告系列目标">
                <SelectControl
                  options={OBJECTIVE_OPTIONS}
                  value={campaign.campaignObjective}
                  onChange={(campaignObjective) =>
                    patchCampaign(campaign.id, {
                      campaignObjective,
                      ...defaultBiddingForObjective(campaignObjective),
                    })
                  }
                />
              </Field>

              {campaign.campaignObjective === "CONVERSIONS" ? (
                <Field label="转化目标">
                  <div className="space-y-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {conversionGoalState === "success"
                          ? `已读取 ${conversionGoals.length} 个目标`
                          : campaign.conversionGoal || "待选择"}
                      </p>
                      <Button
                        disabled={!campaign.adAccountId || conversionGoalState === "loading"}
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() =>
                          void loadConversionGoals(campaign.id, campaign.adAccountId)
                        }
                      >
                        {conversionGoalState === "loading" ? "读取中..." : "读取目标"}
                      </Button>
                    </div>
                    {conversionGoalError ? (
                      <p className="rounded-lg border border-[var(--semantic-error)]/30 px-3 py-2 text-xs leading-relaxed text-[var(--semantic-error)]">
                        {conversionGoalError}
                      </p>
                    ) : null}
                    {conversionGoals.length > 0 ? (
                      <SelectControl
                        options={conversionGoals.map((goal) => ({
                          value: goal.id,
                          label: formatConversionGoalLabel(goal),
                        }))}
                        value={campaign.conversionGoal}
                        onChange={(conversionGoal) =>
                          patchCampaign(campaign.id, { conversionGoal })
                        }
                      />
                    ) : (
                      <Input
                        value={campaign.conversionGoal}
                        onChange={(event) =>
                          patchCampaign(campaign.id, { conversionGoal: event.target.value })
                        }
                      />
                    )}
                  </div>
                </Field>
              ) : null}
            </div>

            <div className="mt-4 space-y-4">
              {campaign.campaignObjective === "CONVERSIONS" ? (
                <Field label="出价类型">
                  <RadioGroup
                    className="flex flex-wrap items-center gap-x-5 gap-y-2"
                    value={campaign.biddingType}
                    onValueChange={(biddingType) =>
                      patchCampaign(campaign.id, { biddingType: biddingType as BiddingType })
                    }
                  >
                    {BIDDING_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--body)] transition-colors hover:text-[var(--ink)]"
                      >
                        <RadioGroupItem value={option.value} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
              ) : null}
              {campaign.campaignObjective === "CLICKS" ? (
                <Field label="出价类型">
                  <RadioGroup
                    className="flex flex-wrap items-center gap-x-5 gap-y-2"
                    value={campaign.clickBiddingType}
                    onValueChange={(clickBiddingType) =>
                      patchCampaign(campaign.id, {
                        clickBiddingType: clickBiddingType as ClickBiddingType,
                      })
                    }
                  >
                    {CLICK_BIDDING_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--body)] transition-colors hover:text-[var(--ink)]"
                      >
                        <RadioGroupItem value={option.value} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
              ) : null}
              <div className={inputGridClassName}>
                <Field label="预算">
                  <NumberStepperControl
                    min={1}
                    step={1}
                    value={campaign.budgetDaily}
                    onChange={(budgetDaily) => patchCampaign(campaign.id, { budgetDaily })}
                  />
                </Field>
                {campaign.campaignObjective === "CONVERSIONS" &&
                campaign.biddingType === "TARGET_CPA" ? (
                  <Field label="目标 CPA">
                    <NumberStepperControl
                      min={0.1}
                      step={0.1}
                      value={campaign.targetCpa}
                      onChange={(targetCpa) => patchCampaign(campaign.id, { targetCpa })}
                    />
                  </Field>
                ) : null}
                {campaign.campaignObjective === "CLICKS" &&
                campaign.clickBiddingType === "MAX_CPC" ? (
                  <Field label="目标 CPC">
                    <NumberStepperControl
                      min={0.01}
                      step={0.01}
                      value={campaign.targetCpc}
                      onChange={(targetCpc) => patchCampaign(campaign.id, { targetCpc })}
                    />
                  </Field>
                ) : null}
              </div>
              <Field label="投放时间">
                <SchedulePicker
                  value={campaign.adSchedule}
                  onChange={(adSchedule) => patchCampaign(campaign.id, { adSchedule })}
                />
              </Field>
            </div>

            <div className={`mt-4 ${inputGridClassName}`}>
              <Field label="操作系统">
                <SelectControl
                  options={OS_OPTIONS}
                  value={campaign.os}
                  onChange={(os) => patchCampaign(campaign.id, { os })}
                />
              </Field>
              <Field label="设备">
                <SelectControl
                  options={DEVICE_OPTIONS}
                  value={campaign.device}
                  onChange={(device) => patchCampaign(campaign.id, { device })}
                />
              </Field>
              <Field label="URL 后缀">
                <Input
                  value={campaign.finalUrlSuffix}
                  onChange={(event) =>
                    patchCampaign(campaign.id, { finalUrlSuffix: event.target.value })
                  }
                />
              </Field>
              <Field className="lg:col-span-2" label="IP 地址排除">
                <TextList
                  placeholder="每行一个 IP 或 CIDR"
                  rows={3}
                  value={campaign.ipExclusions}
                  onChange={(ipExclusions) => patchCampaign(campaign.id, { ipExclusions })}
                />
              </Field>
            </div>
            </div>

            <div className="space-y-4 border-t border-[var(--hairline)] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <HierarchySectionLabel>广告组 · {campaign.adGroups.length}</HierarchySectionLabel>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => addAdGroup(campaign.id)}
                >
                  <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  新增广告组
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {campaign.adGroups.map((group, groupIndex) => (
                  <HierarchySummaryCard
                    key={group.id}
                    canRemove={campaign.adGroups.length > 1}
                    index={groupIndex + 1}
                    levelLabel="广告组"
                    summary={summarizeAdGroupCard(group)}
                    title={group.name}
                    onOpen={() =>
                      setEditorFocus({
                        level: "adgroup",
                        campaignId: campaign.id,
                        groupId: group.id,
                      })
                    }
                    onRemove={() => removeAdGroup(campaign.id, group.id)}
                  />
                ))}
              </div>

            </div>
            </div>
          );
  }

  function renderAdGroupEditor(campaign: CampaignForm, group: AdGroupForm) {
    const {
      geoTargets,
      geoTargetState,
      geoTargetError,
      languageTargets,
      languageTargetState,
      languageTargetError,
    } = getCampaignEditorContext(campaign);

    return (
      <div className="space-y-5">
        <div className="grid gap-3">
          <Field label="广告组名称">
            <Input
              className="min-w-0"
              value={group.name}
              onChange={(event) =>
                updateCampaignAdGroup(campaign.id, group.id, { name: event.target.value })
              }
            />
          </Field>
          <Field label="地理位置">
            <Combobox
              disabled={geoTargetState === "loading"}
              emptyText="没有匹配的地理位置"
              options={buildGeoTargetSelectOptions(geoTargets, group.locations)}
              placeholder="选择地理位置"
              searchPlaceholder="搜索国家、地区、城市或代称"
              value={group.locations}
              onChange={(locations) =>
                updateCampaignAdGroup(campaign.id, group.id, { locations })
              }
            />
            {geoTargetError ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{geoTargetError}</p>
            ) : null}
          </Field>
          <Field label="语言">
            <Combobox
              disabled={languageTargetState === "loading"}
              emptyText="没有匹配的语言"
              options={buildLanguageTargetSelectOptions(languageTargets, group.language)}
              placeholder="选择语言"
              searchPlaceholder="搜索语言或代称"
              value={group.language}
              onChange={(language) =>
                updateCampaignAdGroup(campaign.id, group.id, { language })
              }
            />
            {languageTargetError ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">
                {languageTargetError}
              </p>
            ) : null}
          </Field>
          <div className="grid gap-2">
            <Label>受众群体</Label>
            <div className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
              <p className="mb-2 text-sm font-medium text-[var(--body-strong)]">
                具有以下受众特征的用户
              </p>
              <div className="grid gap-2">
                <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-2.5">
                  <p className="mb-2 text-xs font-medium text-[var(--body)]">性别</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {GENDER_OPTIONS.map((gender) => (
                      <label
                        key={gender.value}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]"
                      >
                        <Checkbox
                          checked={group.genders.includes(gender.value)}
                          onCheckedChange={(checked) =>
                            toggleAdGroupGender(
                              campaign.id,
                              group,
                              gender.value,
                              checked === true,
                            )
                          }
                        />
                        {gender.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-2.5">
                  <p className="mb-2 text-xs font-medium text-[var(--body)]">年龄</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SelectControl
                      className="h-9 w-20 text-sm"
                      options={AGE_OPTIONS}
                      value={group.ageMin}
                      onChange={(ageMin) =>
                        updateCampaignAdGroup(campaign.id, group.id, { ageMin })
                      }
                    />
                    <span className="text-sm text-[var(--body)]">至</span>
                    <SelectControl
                      className="h-9 w-24 text-sm"
                      options={AGE_OPTIONS}
                      value={group.ageMax}
                      onChange={(ageMax) =>
                        updateCampaignAdGroup(campaign.id, group.id, { ageMax })
                      }
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]">
                      <Checkbox
                        checked={group.includeUnknownAge}
                        onCheckedChange={(checked) =>
                          updateCampaignAdGroup(campaign.id, group.id, {
                            includeUnknownAge: checked === true,
                          })
                        }
                      />
                      未知
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--hairline)] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <HierarchySectionLabel>广告 · {group.ads.length}</HierarchySectionLabel>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => addAd(campaign.id, group.id)}
            >
              <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              新增广告
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.ads.map((ad, adIndex) => (
              <HierarchySummaryCard
                key={ad.id}
                canRemove={group.ads.length > 1}
                index={adIndex + 1}
                levelLabel="广告"
                summary={summarizeAdCard(ad)}
                title={ad.name}
                onOpen={() =>
                  setEditorFocus({
                    level: "ad",
                    campaignId: campaign.id,
                    groupId: group.id,
                    adId: ad.id,
                  })
                }
                onRemove={() => removeAd(campaign.id, group.id, ad.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderAdEditor(campaign: CampaignForm, group: AdGroupForm, ad: AdForm) {
    return (
      <div className="grid gap-3">
        <Field label="广告名称">
          <Input
            className="min-w-0"
            value={ad.name}
            onChange={(event) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { name: event.target.value })
            }
          />
        </Field>
        <Field label="商家名称">
          <Input
            className="min-w-0"
            maxLength={25}
            value={ad.businessName}
            onChange={(event) =>
              updateCampaignAd(campaign.id, group.id, ad.id, {
                businessName: event.target.value,
              })
            }
          />
        </Field>
        <Field label="最终到达网址">
          <Input
            className="min-w-0"
            value={ad.finalUrl}
            onChange={(event) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { finalUrl: event.target.value })
            }
          />
        </Field>
        <Field label="号召性用语文字">
          <SelectControl
            className="min-w-0 w-full"
            options={CTA_OPTIONS.map(([value, label]) => ({ value, label }))}
            value={ad.callToAction}
            onChange={(callToAction) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { callToAction })
            }
          />
        </Field>
        <Field label="视频素材链接">
          <VideoLinkList
            key={`${ad.id}:videoLinks`}
            value={ad.videoLinks}
            onChange={(videoLinks) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { videoLinks })
            }
          />
        </Field>
        <Field label="徽标">
          <LogoUploadList
            value={ad.logos}
            onChange={(logos) => updateCampaignAd(campaign.id, group.id, ad.id, { logos })}
          />
        </Field>
        <Field label="短标题">
          <AssetInputList
            key={`${ad.id}:shortHeadlines`}
            maxLength={40}
            placeholder="输入短标题"
            value={ad.shortHeadlines}
            onChange={(shortHeadlines) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { shortHeadlines })
            }
          />
        </Field>
        <Field label="长标题">
          <AssetInputList
            key={`${ad.id}:longHeadlines`}
            maxLength={90}
            placeholder="输入长标题"
            value={ad.longHeadlines}
            onChange={(longHeadlines) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { longHeadlines })
            }
          />
        </Field>
        <Field label="广告内容描述">
          <AssetInputList
            key={`${ad.id}:descriptions`}
            maxLength={90}
            placeholder="输入描述"
            value={ad.descriptions}
            onChange={(descriptions) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { descriptions })
            }
          />
        </Field>
      </div>
    );
  }

  function renderCampaignPreview(campaign: CampaignForm) {
    const account = adAccounts.find((item) => item.id === campaign.adAccountId);
    const highlights = buildCampaignHighlights(
      campaign,
      geoTargetsByAccount[campaign.adAccountId],
      languageTargetsByAccount[campaign.adAccountId],
    );

    return (
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-3xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4">
          <p className="text-caption-uppercase text-[var(--muted)]">Campaign Snapshot</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {campaign.campaignName}
          </h3>
          <div className="mt-4 grid gap-2 text-sm text-[var(--body)]">
            <p>账号：{account ? `${account.name} · ${account.customerId}` : "未选择"}</p>
            <p>目标：{OBJECTIVE_OPTIONS.find((item) => item.value === campaign.campaignObjective)?.label}</p>
            <p>预算：{campaign.budgetDaily} / day</p>
            <p>出价：{campaign.campaignObjective === "CLICKS" ? campaign.clickBiddingType : campaign.biddingType}</p>
            <p>设备：{summarizeOsDevice(campaign.os, campaign.device)}</p>
            <p>时间：{formatSchedule(campaign.adSchedule)}</p>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
            <p className="text-xs font-semibold text-[var(--ink)]">投放摘要</p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[var(--body)]">
              {highlights.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          {campaign.adGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-caption-uppercase text-[var(--muted)]">
                    AdGroup {String(groupIndex + 1).padStart(2, "0")}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                    {group.name}
                  </h4>
                </div>
                <Badge className="normal-case tracking-normal">{group.ads.length} Ads</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.ads.map((ad, adIndex) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Ad {String(adIndex + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{ad.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--body)]">
                      {splitLines(ad.shortHeadlines).slice(0, 2).join(" / ")}
                    </p>
                    <p className="mt-2 truncate text-[11px] text-[var(--muted)]">{ad.finalUrl}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  async function submitDrafts() {
    setIsSubmitting(true);
    setResult(null);

    try {
      const firstAdFallback = createDefaultAd(1);
      let lastResult: ApiResult | null = null;

      for (const campaign of campaigns) {
        const payload = buildPayloadFromCampaign(campaign, firstAdFallback);
        const createResponse = await fetch("/api/campaign-drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const createJson = (await createResponse.json()) as ApiResult;
        lastResult = createJson;

        const draftId =
          createJson.success &&
          createJson.data &&
          typeof createJson.data === "object" &&
          "id" in createJson.data
            ? String(createJson.data.id)
            : "";

        if (!draftId) {
          setResult(createJson);
          return;
        }

        await fetch(`/api/campaign-drafts/${draftId}/validate`, { method: "POST" });
        await fetch(`/api/campaign-drafts/${draftId}/build-preview`, { method: "POST" });
      }

      setResult(
        lastResult
          ? {
              ...lastResult,
              success: true,
              error: undefined,
            }
          : {
              success: true,
              data: { message: `已提交 ${campaigns.length} 个广告系列草稿。` },
            },
      );
    } catch (error) {
      setResult({
        success: false,
        error: {
          code: "CLIENT_SUBMIT_FAILED",
          message: error instanceof Error ? error.message : "提交草稿失败。",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeCampaign = activeCampaignId
    ? campaigns.find((item) => item.id === activeCampaignId) ?? null
    : null;
  const editorFocusGroupId =
    editorFocus && editorFocus.campaignId === activeCampaignId ? editorFocus.groupId : null;
  const activeEditorGroup =
    activeCampaign && editorFocusGroupId
      ? activeCampaign.adGroups.find((group) => group.id === editorFocusGroupId) ?? null
      : null;
  const activeEditorAd =
    editorFocus?.level === "ad" && activeEditorGroup
      ? activeEditorGroup.ads.find((ad) => ad.id === editorFocus.adId) ?? null
      : null;
  const previewCampaign = previewCampaignId
    ? campaigns.find((item) => item.id === previewCampaignId) ?? null
    : null;
  const totalAdGroups = campaigns.reduce(
    (total, campaign) => total + campaign.adGroups.length,
    0,
  );
  const totalAds = campaigns.reduce(
    (total, campaign) =>
      total + campaign.adGroups.reduce((groupTotal, group) => groupTotal + group.ads.length, 0),
    0,
  );
  const campaignSlots = Array.from({ length: 4 }, (_, index) => campaigns[index] ?? null);

  return (
    <div className="ads-launch-stage space-y-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="normal-case tracking-normal">
            {syncState === "loading"
              ? "正在同步 Google Ads 账号..."
              : syncState === "success"
                ? `已同步 ${adAccounts.length} 个投放账号`
                : syncState === "loaded"
                  ? `已加载 ${adAccounts.length} 个已同步账号`
                  : syncState === "error"
                    ? "同步失败"
                    : "等待同步"}
          </Badge>
          {syncedAt ? (
            <span className="text-xs text-[var(--muted)]">
              最近同步：{new Date(syncedAt).toLocaleString()}
            </span>
          ) : null}
          <span className="text-xs text-[var(--muted)]">
            {campaigns.length}/4 Campaigns · {totalAdGroups} AdGroups · {totalAds} Ads
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={syncState === "loading"}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => void syncGoogleAccounts()}
          >
            重新同步
          </Button>
          <Button disabled={campaigns.length >= 4} size="sm" type="button" onClick={addCampaign}>
            <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            新增 Campaign
          </Button>
        </div>
      </div>
      {syncError ? (
        <p className="rounded-2xl border border-[var(--semantic-error)]/30 bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--semantic-error)]">
          {syncError}
        </p>
      ) : null}

      <div className="ads-campaign-grid animate-fade-up">
        {campaignSlots.map((campaign, slotIndex) =>
          campaign ? (
            <CampaignOverviewCard
              key={campaign.id}
              campaign={buildCampaignOverviewMeta(
                campaign,
                slotIndex,
                adAccounts,
                geoTargetsByAccount[campaign.adAccountId],
                languageTargetsByAccount[campaign.adAccountId],
              )}
              canRemove={campaigns.length > 1}
              onEdit={() => openCampaignDetail(campaign.id)}
              onPreview={() => setPreviewCampaignId(campaign.id)}
              onRemove={() => removeCampaign(campaign.id)}
            />
          ) : (
            <CampaignOverviewAddTile key={`empty-${slotIndex}`} onClick={addCampaign} />
          ),
        )}
      </div>

      <div className="ads-action-bar sticky bottom-0 z-10 -mx-4 border-t border-[var(--hairline)] bg-[var(--canvas)]/90 px-4 py-4 backdrop-blur-xl lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">
              {campaigns.length} 个广告系列 · {totalAdGroups} 个广告组 · {totalAds} 条广告
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              提交后依次创建草稿并生成 Google Ads mutate 预览。
            </p>
          </div>
          <Button
            disabled={isSubmitting || !campaigns.some((item) => item.adAccountId)}
            size="lg"
            type="button"
            onClick={() => void submitDrafts()}
          >
            {isSubmitting ? "提交中..." : "创建并生成预览"}
            <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
        {result ? (
          <div
            className={`mt-3 rounded-xl border p-4 ${
              result.success
                ? "border-[var(--hairline)] bg-[var(--surface-strong)]"
                : "border-[var(--semantic-error)]/30 bg-[var(--surface-card)]"
            }`}
          >
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 text-[var(--semantic-error)]" />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  {result.success ? "草稿创建成功" : result.error?.code ?? "创建失败"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {result.success
                    ? "已继续生成 Google Ads mutate 预览。"
                    : result.error?.message}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {activeCampaign ? (
        <BuilderModal
          eyebrow="编辑广告系列"
          hierarchyTrail={[
            { label: "广告系列", name: activeCampaign.campaignName },
          ]}
          title={activeCampaign.campaignName}
          onClose={closeCampaignEditor}
        >
          {renderCampaignEditor(activeCampaign)}
        </BuilderModal>
      ) : null}

      {activeCampaign && activeEditorGroup && editorFocus?.level === "adgroup" ? (
        <BuilderModal
          eyebrow="编辑广告组"
          hierarchyTrail={[
            { label: "广告系列", name: activeCampaign.campaignName },
            { label: "广告组", name: activeEditorGroup.name },
          ]}
          maxWidthClassName="max-w-4xl"
          title={activeEditorGroup.name}
          zIndexClassName="z-[60]"
          onBack={() => setEditorFocus(null)}
          onClose={() => setEditorFocus(null)}
        >
          {renderAdGroupEditor(activeCampaign, activeEditorGroup)}
        </BuilderModal>
      ) : null}

      {activeCampaign && activeEditorGroup && activeEditorAd && editorFocus?.level === "ad" ? (
        <BuilderModal
          eyebrow="编辑广告"
          hierarchyTrail={[
            { label: "广告系列", name: activeCampaign.campaignName },
            { label: "广告组", name: activeEditorGroup.name },
            { label: "广告", name: activeEditorAd.name },
          ]}
          maxWidthClassName="max-w-3xl"
          title={activeEditorAd.name}
          zIndexClassName="z-[70]"
          onBack={() =>
            setEditorFocus({
              level: "adgroup",
              campaignId: activeCampaign.id,
              groupId: activeEditorGroup.id,
            })
          }
          onClose={() =>
            setEditorFocus({
              level: "adgroup",
              campaignId: activeCampaign.id,
              groupId: activeEditorGroup.id,
            })
          }
        >
          {renderAdEditor(activeCampaign, activeEditorGroup, activeEditorAd)}
        </BuilderModal>
      ) : null}

      {previewCampaign ? (
        <BuilderModal
          eyebrow="预览广告系列"
          hierarchyTrail={[
            { label: "广告系列", name: previewCampaign.campaignName },
          ]}
          title={previewCampaign.campaignName}
          onClose={() => setPreviewCampaignId(null)}
        >
          {renderCampaignPreview(previewCampaign)}
        </BuilderModal>
      ) : null}
    </div>
  );
}
