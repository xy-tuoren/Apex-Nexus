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
  CircleDollarSign,
  Clock3,
  Copy,
  FileJson,
  Layers3,
  Link2,
  MapPin,
  MonitorSmartphone,
  Plus,
  Settings2,
  Trash2,
  UserRound,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  draftCount: number;
  jobCount: number;
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

type FormState = {
  adAccountId: string;
  advertisingType: AdvertisingType;
  campaignName: string;
  campaignObjective: string;
  conversionGoal: string;
  biddingType: BiddingType;
  targetCpa: string;
  budgetDaily: string;
  os: string;
  device: string;
  adSchedule: ScheduleGridValue;
  trackingTemplate: string;
  finalUrlSuffix: string;
  ipExclusions: string;
  adGroups: AdGroupForm[];
};

const inputGridClassName = "grid gap-4 md:grid-cols-2";

const OS_OPTIONS = [
  { value: "all", label: "all" },
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iOS" },
  { value: "WINDOWS", label: "Windows" },
  { value: "MAC_OS", label: "macOS" },
  { value: "CHROME_OS", label: "ChromeOS" },
];

const DEVICE_OPTIONS = [
  { value: "all", label: "all" },
  { value: "DESKTOP", label: "desktop" },
  { value: "MOBILE", label: "mobile" },
  { value: "TABLET", label: "tablet" },
  { value: "CONNECTED_TV", label: "tv screen" },
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
  { value: "TARGET_CPA", label: "TARGET_CPA" },
  { value: "MAXIMIZE_CONVERSIONS", label: "MAXIMIZE_CONVERSIONS" },
];

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
  { value: "CONVERSIONS", label: "转化 / Conversions" },
  { value: "CLICKS", label: "点击次数 / Clicks" },
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
  { key: "MONDAY", label: "MON." },
  { key: "TUESDAY", label: "TUES." },
  { key: "WEDNESDAY", label: "WED." },
  { key: "THURSDAY", label: "THUR." },
  { key: "FRIDAY", label: "FRI." },
  { key: "SATURDAY", label: "SAT." },
  { key: "SUNDAY", label: "SUN." },
];

const SCHEDULE_HOURS = Array.from({ length: 24 }, (_, index) => index);

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

function buildBiddingPayload(form: FormState) {
  if (form.campaignObjective === "CLICKS") {
    return { strategy: "MAXIMIZE_CLICKS" as const };
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

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
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
      return `${day.key}: OFF`;
    }
    return `${day.key}: ${ranges
      .map(([start, end]) => `${formatHour(start)}-${formatHour(end)}`)
      .join(", ")}`;
  }).join("; ");
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

function buildDefaultForm(account?: GoogleAdAccount): FormState {
  return {
    adAccountId: account?.id ?? "",
    advertisingType: "DEMAND_GEN",
    campaignName: "Conversion Campaign",
    campaignObjective: "CONVERSIONS",
    conversionGoal: "PURCHASE",
    biddingType: "TARGET_CPA",
    targetCpa: "1.2",
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
    <div className={`grid min-w-0 gap-2 ${className}`}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`animate-fade-up ${className}`}>
      <CardHeader>
        <div className="section-eyebrow">
          <p className="text-caption-uppercase text-[var(--muted)]">{eyebrow}</p>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
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

function InlineSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <label className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3">
      <span className="text-right text-sm font-medium text-[var(--ink)]">{label}</span>
      <SelectControl className="h-10 text-sm" value={value} onChange={onChange} options={options} />
    </label>
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
    <div className="grid gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">最多可添加 {maxItems} 条</p>
        <Button
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
      <div className="grid gap-3">
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
                className="h-11 w-11 shrink-0 rounded-lg px-0"
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

function StatRow({ icon: Icon, label, value }: { icon: typeof Settings2; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="voice-icon-plate shrink-0">
          <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="truncate text-body-sm text-[var(--muted)]">{label}</span>
      </div>
      <span className="max-w-[12rem] truncate text-sm font-medium text-[var(--ink)]">{value}</span>
    </div>
  );
}

function CountBadge({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)] px-3 py-1 text-xs text-[var(--body)]">
      <span className="font-semibold text-[var(--ink)]">{value}</span>
      {label}
    </span>
  );
}

function NumberStepper({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
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
    <div className="grid grid-cols-[6rem_minmax(0,12rem)] items-center gap-3">
      <Label className="text-right text-sm normal-case tracking-normal text-[var(--body-strong)]">
        {label}
      </Label>
      <div className="grid h-10 grid-cols-[40px_minmax(0,1fr)_40px] overflow-hidden rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-card)]">
        <button
          className="border-r border-[var(--hairline)] text-lg text-[var(--body)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
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
          className="border-l border-[var(--hairline)] text-lg text-[var(--body)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
          type="button"
          onClick={() => applyDelta(step)}
        >
          +
        </button>
      </div>
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
        className={`flex h-10 min-w-[7.5rem] items-center justify-between rounded-xl border px-4 text-base font-medium text-[var(--ink)] transition ${
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
    <div className="relative overflow-visible rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="mb-1.5 grid grid-cols-[3.75rem_1fr_5.75rem] items-end gap-2">
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
                <div key={day.key} className="grid grid-cols-[3.75rem_1fr_5.75rem] items-center gap-2">
                  <span className="text-right text-[11px] font-semibold text-[var(--muted)]">{day.label}</span>
                  <div
                    className="grid h-7 overflow-hidden rounded-md border border-[var(--hairline)]"
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
                              ? "bg-[var(--ink)]"
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
                      className="h-7 min-w-[2.75rem] px-2 text-xs"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => clearDay(day.key)}
                    >
                      清空
                    </Button>
                    <Button
                      className="h-7 min-w-[2.75rem] px-2 text-xs"
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

      <div className="mt-3 grid grid-cols-[3.75rem_1fr_5.75rem] items-center gap-2">
        <Label className="text-right text-xs normal-case tracking-normal text-[var(--body-strong)]">
          range
        </Label>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex h-10 items-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-strong)] p-0.5">
            <button
              className={`h-8 rounded-full px-3.5 text-xs font-medium transition ${
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
              className={`h-8 rounded-full px-3.5 text-xs font-medium transition ${
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
            <div className="flex flex-wrap items-center gap-2">
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
                className="flex h-10 items-center justify-center rounded-xl px-4 text-sm"
                type="button"
                variant="outline"
                onClick={applyWeekRange}
              >
                应用
              </Button>
            </div>
          ) : null}
        </div>
        <p className="flex h-10 items-center text-[11px] leading-relaxed text-[var(--muted)]">
          {mode === "week" ? "按周会覆盖全部日期" : "按天直接在图表点选"}
        </p>
      </div>
    </div>
  );
}

export function LaunchBuilder({
  initialAdAccounts,
  accountSyncError: initialSyncError = null,
  accountsSyncedAt: initialSyncedAt = null,
  initialMccAccounts = [],
  draftCount,
  jobCount,
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
  const [form, setForm] = useState<FormState>(() => buildDefaultForm(firstAccount));
  const [activeAdGroupId, setActiveAdGroupId] = useState("adg_1");
  const [activeAdId, setActiveAdId] = useState("ad_1");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [preview, setPreview] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoalPoint[]>([]);
  const [conversionGoalState, setConversionGoalState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [conversionGoalError, setConversionGoalError] = useState<string | null>(null);
  const [geoTargets, setGeoTargets] = useState<GeoTargetOption[]>(FALLBACK_GEO_TARGET_OPTIONS);
  const [geoTargetState, setGeoTargetState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [geoTargetError, setGeoTargetError] = useState<string | null>(null);
  const [languageTargets, setLanguageTargets] = useState<LanguageTargetOption[]>(
    FALLBACK_LANGUAGE_OPTIONS,
  );
  const [languageTargetState, setLanguageTargetState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [languageTargetError, setLanguageTargetError] = useState<string | null>(null);

  const selectedAccount = adAccounts.find((account) => account.id === form.adAccountId);
  const selectedOperationMcc = mccAccounts.find((mcc) => mcc.id === selectedAccount?.operationMccId);
  const loginCustomerId = selectedAccount?.loginCustomerId ?? selectedOperationMcc?.customerId;
  const activeAdGroup =
    form.adGroups.find((group) => group.id === activeAdGroupId) ?? form.adGroups[0];
  const activeAd =
    activeAdGroup?.ads.find((ad) => ad.id === activeAdId) ?? activeAdGroup?.ads[0];
  const allAds = form.adGroups.flatMap((group) => group.ads);
  const firstAd = allAds[0] ?? createDefaultAd(1);
  const geoTargetSelectOptions = useMemo<ComboboxOption[]>(() => {
    const options = geoTargets.map((target) => ({
      value: target.resourceName,
      label: geoTargetLabel(target),
      keywords: [target.name, target.canonicalName, target.countryCode, target.targetType],
    }));
    const activeLocation = activeAdGroup?.locations;

    if (activeLocation && !options.some((option) => option.value === activeLocation)) {
      options.unshift({ value: activeLocation, label: activeLocation, keywords: [] });
    }

    return options;
  }, [activeAdGroup?.locations, geoTargets]);
  const languageTargetSelectOptions = useMemo<ComboboxOption[]>(() => {
    const options = languageTargets.map((language) => ({
      value: language.resourceName,
      label: languageTargetLabel(language),
      keywords: [language.name, language.code, language.id],
    }));
    const activeLanguage = activeAdGroup?.language;

    if (activeLanguage && !options.some((option) => option.value === activeLanguage)) {
      options.unshift({ value: activeLanguage, label: activeLanguage, keywords: [] });
    }

    return options;
  }, [activeAdGroup?.language, languageTargets]);

  const loadConversionGoals = useCallback(async (adAccountId = form.adAccountId) => {
    if (!adAccountId) {
      setConversionGoals([]);
      setConversionGoalState("idle");
      setConversionGoalError(null);
      return;
    }

    setConversionGoalState("loading");
    setConversionGoalError(null);

    try {
      const account =
        adAccounts.find((item) => item.id === adAccountId) ?? selectedAccount;
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
      setConversionGoals(goals);
      setForm((current) => ({
        ...current,
        conversionGoal: goals[0]?.id ?? "",
      }));
      setConversionGoalState("success");
    } catch (error) {
      setConversionGoalState("error");
      setConversionGoals([]);
      setConversionGoalError(error instanceof Error ? error.message : "读取真实转化目标失败。");
    }
  }, [adAccounts, form.adAccountId, mccAccounts, selectedAccount]);

  const loadGeoTargets = useCallback(async (adAccountId = form.adAccountId) => {
    if (!adAccountId) {
      setGeoTargets(FALLBACK_GEO_TARGET_OPTIONS);
      setGeoTargetState("idle");
      setGeoTargetError(null);
      return;
    }

    setGeoTargetState("loading");
    setGeoTargetError(null);

    try {
      const account =
        adAccounts.find((item) => item.id === adAccountId) ?? selectedAccount;
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
      setGeoTargets(targets.length ? targets : FALLBACK_GEO_TARGET_OPTIONS);
      setGeoTargetState("success");
    } catch (error) {
      setGeoTargets(FALLBACK_GEO_TARGET_OPTIONS);
      setGeoTargetState("error");
      setGeoTargetError(error instanceof Error ? error.message : "读取地理位置失败。");
    }
  }, [adAccounts, form.adAccountId, mccAccounts, selectedAccount]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGeoTargets(form.adAccountId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [form.adAccountId, loadGeoTargets]);

  const loadLanguageTargets = useCallback(async (adAccountId = form.adAccountId) => {
    if (!adAccountId) {
      setLanguageTargets(FALLBACK_LANGUAGE_OPTIONS);
      setLanguageTargetState("idle");
      setLanguageTargetError(null);
      return;
    }

    setLanguageTargetState("loading");
    setLanguageTargetError(null);

    try {
      const account =
        adAccounts.find((item) => item.id === adAccountId) ?? selectedAccount;
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
      setLanguageTargets(languages.length ? languages : FALLBACK_LANGUAGE_OPTIONS);
      setLanguageTargetState("success");
    } catch (error) {
      setLanguageTargets(FALLBACK_LANGUAGE_OPTIONS);
      setLanguageTargetState("error");
      setLanguageTargetError(error instanceof Error ? error.message : "读取语言失败。");
    }
  }, [adAccounts, form.adAccountId, mccAccounts, selectedAccount]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLanguageTargets(form.adAccountId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [form.adAccountId, loadLanguageTargets]);

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

      setForm((current) => {
        const account =
          data.adAccounts.find((item) => item.id === current.adAccountId) ?? data.adAccounts[0];

        if (!account) {
          return current;
        }

        return {
          ...current,
          adAccountId: account.id,
        };
      });

      setSyncState("success");
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "同步 Google Ads 账号失败。");
    }
  }, []);

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateAdGroup(groupId: string, patch: Partial<AdGroupForm>) {
    setForm((current) => ({
      ...current,
      adGroups: current.adGroups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    }));
  }

  function toggleAdGroupGender(group: AdGroupForm, gender: string, checked: boolean) {
    const genders = checked
      ? Array.from(new Set([...group.genders, gender]))
      : group.genders.filter((item) => item !== gender);

    updateAdGroup(group.id, { genders });
  }

  function updateAd(groupId: string, adId: string, patch: Partial<AdForm>) {
    setForm((current) => ({
      ...current,
      adGroups: current.adGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              ads: group.ads.map((ad) => (ad.id === adId ? { ...ad, ...patch } : ad)),
            }
          : group,
      ),
    }));
  }

  function addAdGroup() {
    const id = `adg_${form.adGroups.length + 1}_${Date.now()}`;
    const nextGroup = {
      ...createDefaultAdGroup(form.adGroups.length + 1),
      id,
      ads: [{ ...createDefaultAd(1), id: `${id}_ad_1` }],
    };

    setForm((current) => ({ ...current, adGroups: [...current.adGroups, nextGroup] }));
    setActiveAdGroupId(id);
    setActiveAdId(nextGroup.ads[0].id);
  }

  function removeAdGroup(groupId: string) {
    if (form.adGroups.length === 1) {
      return;
    }

    const nextGroups = form.adGroups.filter((group) => group.id !== groupId);
    setForm((current) => ({ ...current, adGroups: nextGroups }));

    if (activeAdGroupId === groupId) {
      setActiveAdGroupId(nextGroups[0].id);
      setActiveAdId(nextGroups[0].ads[0].id);
    }
  }

  function addAd(groupId: string) {
    const group = form.adGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    const id = `${groupId}_ad_${group.ads.length + 1}_${Date.now()}`;
    const nextAd = {
      ...createDefaultAd(group.ads.length + 1),
      id,
      finalUrl: group.ads[0]?.finalUrl ?? "https://example.com/landing",
    };

    updateAdGroup(groupId, { ads: [...group.ads, nextAd] });
    setActiveAdGroupId(groupId);
    setActiveAdId(id);
  }

  function removeAd(groupId: string, adId: string) {
    const group = form.adGroups.find((item) => item.id === groupId);
    if (!group || group.ads.length === 1) {
      return;
    }

    const nextAds = group.ads.filter((ad) => ad.id !== adId);
    updateAdGroup(groupId, { ads: nextAds });

    if (activeAdId === adId) {
      setActiveAdId(nextAds[0].id);
    }
  }

  const payload = useMemo(() => {
    const adGroups = form.adGroups.map((group) => ({
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
    const selectedDevices = form.device === "all" ? [] : [form.device];
    const bidding = buildBiddingPayload(form);

    return {
      adAccountId: form.adAccountId,
      advertisingType: form.advertisingType,
      name: form.campaignName,
      campaignObjective: form.campaignObjective,
      conversionGoal: form.campaignObjective === "CONVERSIONS" ? form.conversionGoal : undefined,
      finalUrl: primaryAd?.finalUrl ?? firstAd.finalUrl,
      budgetMicros: microsFromAmount(form.budgetDaily),
      bidding,
      locations: primaryAdGroup?.locations.length ? primaryAdGroup.locations : ["US"],
      language: primaryAdGroup?.language ?? "zh-CN",
      os: form.os,
      device: form.device,
      devices: selectedDevices,
      adSchedule: formatSchedule(form.adSchedule),
      urlPrefix: form.finalUrlSuffix,
      trackingTemplate: form.trackingTemplate || undefined,
      finalUrlSuffix: form.finalUrlSuffix,
      ipExclusions: splitLines(form.ipExclusions),
      assets: {
        headlines: primaryAd?.headlines ?? [],
        longHeadlines: primaryAd?.longHeadlines ?? [],
        descriptions: primaryAd?.descriptions ?? [],
        businessName: primaryAd?.businessName ?? firstAd.businessName,
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
  }, [firstAd, form]);

  const fullConfigPreview = useMemo(
    () => ({
      apiPayload: payload,
      hierarchy: {
        campaign: {
          account: selectedAccount?.customerId ?? null,
          name: form.campaignName,
          objective: form.campaignObjective,
          conversionGoal:
            form.campaignObjective === "CONVERSIONS" ? form.conversionGoal : null,
          biddingType: payload.bidding.strategy,
          cpa:
            form.campaignObjective === "CONVERSIONS" && form.biddingType === "TARGET_CPA"
              ? form.targetCpa
              : null,
          budget: form.budgetDaily,
          os: form.os,
          device: form.device,
          schedule: formatSchedule(form.adSchedule),
          urlOptions: {
            urlPrefix: form.finalUrlSuffix,
            finalUrlSuffix: form.finalUrlSuffix,
          },
          ipExclusions: splitLines(form.ipExclusions),
        },
        adGroups: payload.adGroups,
      },
    }),
    [form, payload, selectedAccount],
  );

  async function submitDraft() {
    setIsSubmitting(true);
    setResult(null);
    setPreview(null);

    try {
      const createResponse = await fetch("/api/campaign-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createJson = (await createResponse.json()) as ApiResult;
      setResult(createJson);

      const draftId =
        createJson.success &&
        createJson.data &&
        typeof createJson.data === "object" &&
        "id" in createJson.data
          ? String(createJson.data.id)
          : "";

      if (!draftId) {
        return;
      }

      await fetch(`/api/campaign-drafts/${draftId}/validate`, { method: "POST" });
      const previewResponse = await fetch(`/api/campaign-drafts/${draftId}/build-preview`, {
        method: "POST",
      });
      const previewJson = (await previewResponse.json()) as ApiResult;
      setPreview(previewJson);
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

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="launch-heading"
        className="animate-fade-up border-b border-[var(--hairline)] py-10 lg:py-14"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <div className="section-eyebrow">
              <p className="text-caption-uppercase text-[var(--muted)]">Google Ads Form Builder</p>
            </div>
            <h1 className="text-heading-xl mt-4 max-w-4xl text-[var(--ink)]" id="launch-heading">
              广告投放表单
              <span className="block text-[var(--body-strong)]">Campaign / AdGroup / Ad</span>
            </h1>
            <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-[var(--body)]">
              顶层先确定账号、目标、预算和投放约束；每个 AdGroup 独立承载地域、受众和语言；
              每个 AdGroup 下可以继续创建多个广告创意。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <CountBadge label="AdGroups" value={form.adGroups.length} />
              <CountBadge label="Ads" value={allAds.length} />
              <Badge className="normal-case tracking-normal">
                {selectedAccount?.customerId ?? "未选择投放账号"}
              </Badge>
            </div>
          </div>

          <Card className="animate-fade-up stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                当前环境
              </CardTitle>
              <CardDescription>表单提交后生成暂停态创建预览。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <StatRow icon={FileJson} label="草稿 / 任务" value={`${draftCount} / ${jobCount}`} />
              <StatRow icon={UserRound} label="操作 MCC" value={loginCustomerId ?? "未选择"} />
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <SectionCard
            eyebrow="Campaign"
            title="Campaign 层级"
            description="账号、名称、目标、转化、budget、cpa、schedule、设备、网址选项和 IP 排除都在这里收口。"
          >
            <div className="mb-5 flex flex-wrap items-center gap-2">
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
              <Button
                disabled={syncState === "loading"}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => void syncGoogleAccounts()}
              >
                重新同步
              </Button>
            </div>
            {syncError ? (
              <p className="mb-4 rounded-lg border border-[var(--semantic-error)]/30 bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--semantic-error)]">
                {syncError}
              </p>
            ) : null}

            <div className={inputGridClassName}>
              <Field label="账户">
                <SelectControl
                  disabled={syncState === "loading" || adAccounts.length === 0}
                  options={adAccounts.map((account) => ({
                    value: account.id,
                    label: `${account.name} · ${account.customerId}`,
                  }))}
                  placeholder="暂无可用账号"
                  value={form.adAccountId}
                  onChange={(adAccountId) => {
                    patchForm({ adAccountId, conversionGoal: "" });
                    setConversionGoals([]);
                    setConversionGoalState("idle");
                    setConversionGoalError(null);
                  }}
                />
              </Field>
              <Field label="Campaign 名称">
                <Input
                  value={form.campaignName}
                  onChange={(event) => patchForm({ campaignName: event.target.value })}
                />
              </Field>
            </div>

            <div className="mt-5 space-y-5">
              <Field label="广告系列目标">
                <SelectControl
                  options={OBJECTIVE_OPTIONS}
                  value={form.campaignObjective}
                  onChange={(campaignObjective) => patchForm({ campaignObjective })}
                />
              </Field>

              {form.campaignObjective === "CONVERSIONS" ? (
                <Field label="转化目标">
                  <div className="space-y-3 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {conversionGoalState === "success"
                          ? `已读取 ${conversionGoals.length} 个目标`
                          : form.conversionGoal || "待选择"}
                      </p>
                      <Button
                        disabled={!form.adAccountId || conversionGoalState === "loading"}
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => void loadConversionGoals()}
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
                          label: `${goal.category} · ${goal.origin} · ${goal.actionCount} actions`,
                        }))}
                        value={form.conversionGoal}
                        onChange={(conversionGoal) => patchForm({ conversionGoal })}
                      />
                    ) : (
                      <Input
                        value={form.conversionGoal}
                        onChange={(event) => patchForm({ conversionGoal: event.target.value })}
                      />
                    )}
                  </div>
                </Field>
              ) : null}
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3">
                {form.campaignObjective === "CONVERSIONS" ? (
                  <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center">
                    <span className="text-sm font-medium text-[var(--ink)]">Bidding Type</span>
                    <RadioGroup
                      className="flex flex-wrap items-center gap-x-5 gap-y-2"
                      value={form.biddingType}
                      onValueChange={(biddingType) =>
                        patchForm({ biddingType: biddingType as BiddingType })
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
                  </div>
                ) : null}
                <NumberStepper
                  label="budget"
                  min={1}
                  step={1}
                  value={form.budgetDaily}
                  onChange={(budgetDaily) => patchForm({ budgetDaily })}
                />
                {form.campaignObjective === "CONVERSIONS" && form.biddingType === "TARGET_CPA" ? (
                  <NumberStepper
                    label="cpa"
                    min={0.1}
                    step={0.1}
                    value={form.targetCpa}
                    onChange={(targetCpa) => patchForm({ targetCpa })}
                  />
                ) : null}
              </div>
              <Field label="schedule">
                <SchedulePicker
                  value={form.adSchedule}
                  onChange={(adSchedule) => patchForm({ adSchedule })}
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="grid content-start gap-3">
                <InlineSelectField
                  label="os"
                  options={OS_OPTIONS}
                  value={form.os}
                  onChange={(os) => patchForm({ os })}
                />
                <InlineSelectField
                  label="device"
                  options={DEVICE_OPTIONS}
                  value={form.device}
                  onChange={(device) => patchForm({ device })}
                />
              </div>
              <div className="grid gap-4">
                <label className="grid grid-cols-[86px_minmax(0,1fr)] items-center gap-3">
                  <span className="text-right text-sm font-medium text-[var(--ink)]">
                    url_prefix
                  </span>
                  <Input
                    aria-label="url_prefix"
                    value={form.finalUrlSuffix}
                    onChange={(event) => patchForm({ finalUrlSuffix: event.target.value })}
                  />
                </label>
                <Field label="IP 地址排除">
                  <TextList
                    placeholder="每行一个 IP 或 CIDR"
                    rows={3}
                    value={form.ipExclusions}
                    onChange={(ipExclusions) => patchForm({ ipExclusions })}
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="AdGroup"
            title="AdGroup 层级"
            description="左侧选择广告组，右侧编辑该广告组的名称、地域、受众群体和语言。"
            className="stagger-2"
          >
            <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--ink)]">广告组</p>
                  <Button size="sm" type="button" variant="outline" onClick={addAdGroup}>
                    <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    新增
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.adGroups.map((group, index) => (
                    <button
                      key={group.id}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        activeAdGroup?.id === group.id
                          ? "border-[var(--ink)] bg-[var(--surface-strong)]"
                          : "border-[var(--hairline)] bg-[var(--surface-card)] hover:border-[var(--hairline-strong)]"
                      }`}
                      type="button"
                      onClick={() => {
                        setActiveAdGroupId(group.id);
                        setActiveAdId(group.ads[0]?.id ?? "");
                      }}
                    >
                      <span className="block text-xs text-[var(--muted)]">AdGroup {index + 1}</span>
                      <span className="mt-1 block truncate text-sm font-medium text-[var(--ink)]">
                        {group.name}
                      </span>
                      <span className="mt-2 block text-xs text-[var(--muted)]">
                        {group.ads.length} ads · {group.language}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {activeAdGroup ? (
                <div className="space-y-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{activeAdGroup.name}</p>
                      <p className="text-xs text-[var(--muted)]">地域、受众、语言会继承到该组下广告。</p>
                    </div>
                    <Button
                      disabled={form.adGroups.length === 1}
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => removeAdGroup(activeAdGroup.id)}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Name">
                      <Input
                        value={activeAdGroup.name}
                        onChange={(event) =>
                          updateAdGroup(activeAdGroup.id, { name: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="地理位置">
                      <Combobox
                        disabled={geoTargetState === "loading"}
                        emptyText="没有匹配的地理位置"
                        options={geoTargetSelectOptions}
                        placeholder="选择地理位置"
                        searchPlaceholder="搜索国家、地区、城市或代称"
                        value={activeAdGroup.locations}
                        onChange={(locations) =>
                          updateAdGroup(activeAdGroup.id, { locations })
                        }
                      />
                      {geoTargetError ? (
                        <p className="text-xs leading-relaxed text-[var(--semantic-error)]">
                          {geoTargetError}
                        </p>
                      ) : null}
                    </Field>
                    <Field label="语言">
                      <Combobox
                        disabled={languageTargetState === "loading"}
                        emptyText="没有匹配的语言"
                        options={languageTargetSelectOptions}
                        placeholder="选择语言"
                        searchPlaceholder="搜索语言或代称"
                        value={activeAdGroup.language}
                        onChange={(language) =>
                          updateAdGroup(activeAdGroup.id, { language })
                        }
                      />
                      {languageTargetError ? (
                        <p className="text-xs leading-relaxed text-[var(--semantic-error)]">
                          {languageTargetError}
                        </p>
                      ) : null}
                    </Field>
                    <div className="grid gap-2 md:col-span-2">
                      <Label>受众群体</Label>
                      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
                        <p className="mb-3 text-sm font-medium text-[var(--ink)]">
                          具有以下受众特征的用户
                        </p>
                        <div className="grid gap-3">
                          <div className="rounded-lg border border-[var(--hairline)] p-3">
                            <p className="mb-3 text-sm text-[var(--body)]">性别</p>
                            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                              {GENDER_OPTIONS.map((gender) => (
                                <label
                                  key={gender.value}
                                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--ink)]"
                                >
                                  <Checkbox
                                    checked={activeAdGroup.genders.includes(gender.value)}
                                    onCheckedChange={(checked) =>
                                      toggleAdGroupGender(activeAdGroup, gender.value, checked === true)
                                    }
                                  />
                                  {gender.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg border border-[var(--hairline)] p-3">
                            <p className="mb-3 text-sm text-[var(--body)]">年龄</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <SelectControl
                                className="h-10 w-24 text-sm"
                                options={AGE_OPTIONS}
                                value={activeAdGroup.ageMin}
                                onChange={(ageMin) => updateAdGroup(activeAdGroup.id, { ageMin })}
                              />
                              <span className="text-sm text-[var(--body)]">至</span>
                              <SelectControl
                                className="h-10 w-32 text-sm"
                                options={AGE_OPTIONS}
                                value={activeAdGroup.ageMax}
                                onChange={(ageMax) => updateAdGroup(activeAdGroup.id, { ageMax })}
                              />
                              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--ink)]">
                                <Checkbox
                                  checked={activeAdGroup.includeUnknownAge}
                                  onCheckedChange={(checked) =>
                                    updateAdGroup(activeAdGroup.id, {
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
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Ad"
            title="Ad 层级"
            description="在当前 AdGroup 下创建多个广告，分别维护名称、最终到达网址、视频、徽标、标题、描述、CTA 和商家名称。"
            className="stagger-3"
          >
            {activeAdGroup ? (
              <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--ink)]">广告</p>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => addAd(activeAdGroup.id)}
                    >
                      <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                      新增
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {activeAdGroup.ads.map((ad, index) => (
                      <button
                        key={ad.id}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          activeAd?.id === ad.id
                            ? "border-[var(--ink)] bg-[var(--surface-strong)]"
                            : "border-[var(--hairline)] bg-[var(--surface-card)] hover:border-[var(--hairline-strong)]"
                        }`}
                        type="button"
                        onClick={() => setActiveAdId(ad.id)}
                      >
                        <span className="block text-xs text-[var(--muted)]">Ad {index + 1}</span>
                        <span className="mt-1 block truncate text-sm font-medium text-[var(--ink)]">
                          {ad.name}
                        </span>
                        <span className="mt-2 block truncate text-xs text-[var(--muted)]">
                          {ad.businessName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {activeAd ? (
                  <div className="min-w-0 space-y-5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--ink)]">{activeAd.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          短标题 {splitLines(activeAd.shortHeadlines).length} · 视频{" "}
                          {splitLines(activeAd.videoLinks).length}
                        </p>
                      </div>
                      <Button
                        disabled={activeAdGroup.ads.length === 1}
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => removeAd(activeAdGroup.id, activeAd.id)}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                      </Button>
                    </div>

                    <div className={inputGridClassName}>
                      <Field label="广告名称">
                        <Input
                          className="min-w-0"
                          value={activeAd.name}
                          onChange={(event) =>
                            updateAd(activeAdGroup.id, activeAd.id, { name: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="商家名称">
                        <Input
                          className="min-w-0"
                          maxLength={25}
                          value={activeAd.businessName}
                          onChange={(event) =>
                            updateAd(activeAdGroup.id, activeAd.id, {
                              businessName: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="最终到达网址">
                        <Input
                          className="min-w-0"
                          value={activeAd.finalUrl}
                          onChange={(event) =>
                            updateAd(activeAdGroup.id, activeAd.id, { finalUrl: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="号召性用语文字">
                        <SelectControl
                          className="min-w-0 w-full"
                          options={CTA_OPTIONS.map(([value, label]) => ({ value, label }))}
                          value={activeAd.callToAction}
                          onChange={(callToAction) =>
                            updateAd(activeAdGroup.id, activeAd.id, { callToAction })
                          }
                        />
                      </Field>
                    </div>

                    <div className="grid min-w-0 gap-5">
                      <Field label="视频素材链接">
                        <VideoLinkList
                          key={`${activeAd.id}:videoLinks`}
                          value={activeAd.videoLinks}
                          onChange={(videoLinks) =>
                            updateAd(activeAdGroup.id, activeAd.id, { videoLinks })
                          }
                        />
                      </Field>
                      <Field label="徽标">
                        <LogoUploadList
                          value={activeAd.logos}
                          onChange={(logos) => updateAd(activeAdGroup.id, activeAd.id, { logos })}
                        />
                      </Field>
                    </div>

                    <Field label="短标题">
                      <AssetInputList
                        key={`${activeAd.id}:shortHeadlines`}
                        maxLength={40}
                        placeholder="输入短标题"
                        value={activeAd.shortHeadlines}
                        onChange={(shortHeadlines) =>
                          updateAd(activeAdGroup.id, activeAd.id, { shortHeadlines })
                        }
                      />
                    </Field>
                    <Field label="长标题">
                      <AssetInputList
                        key={`${activeAd.id}:longHeadlines`}
                        maxLength={90}
                        placeholder="输入长标题"
                        value={activeAd.longHeadlines}
                        onChange={(longHeadlines) =>
                          updateAd(activeAdGroup.id, activeAd.id, { longHeadlines })
                        }
                      />
                    </Field>
                    <Field label="广告内容描述">
                      <AssetInputList
                        key={`${activeAd.id}:descriptions`}
                        maxLength={90}
                        placeholder="输入描述"
                        value={activeAd.descriptions}
                        onChange={(descriptions) =>
                          updateAd(activeAdGroup.id, activeAd.id, { descriptions })
                        }
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            ) : null}
          </SectionCard>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card className="animate-fade-up stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChevronRight aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                提交
              </CardTitle>
              <CardDescription>按 Campaign → AdGroup → Ad 的层级提交草稿。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={isSubmitting || !form.adAccountId}
                type="button"
                onClick={submitDraft}
              >
                {isSubmitting ? "提交中..." : "创建并生成预览"}
                <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Button>
              {result ? (
                <div
                  className={`rounded-xl border p-4 ${
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
                        {result.success ? "已继续生成 Google Ads mutate 预览。" : result.error?.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers3 aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                联动概览
              </CardTitle>
              <CardDescription>当前表单的关键选择。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <StatRow
                icon={CircleDollarSign}
                label="bidding"
                value={
                  payload.bidding.strategy === "MAXIMIZE_CLICKS"
                    ? `MAXIMIZE_CLICKS · budget ${form.budgetDaily}`
                    : form.biddingType === "TARGET_CPA"
                    ? `TARGET_CPA · budget ${form.budgetDaily} · cpa ${form.targetCpa}`
                    : `MAXIMIZE_CONVERSIONS · budget ${form.budgetDaily}`
                }
              />
              <StatRow icon={Clock3} label="schedule" value={formatSchedule(form.adSchedule)} />
              <StatRow icon={MonitorSmartphone} label="os / device" value={`${form.os} / ${form.device}`} />
              <StatRow icon={MapPin} label="当前地域" value={activeAdGroup?.locations ?? "-"} />
              <StatRow icon={Link2} label="当前 URL" value={activeAd?.finalUrl ?? "-"} />
              <StatRow icon={Video} label="广告数量" value={`${form.adGroups.length} / ${allAds.length}`} />
            </CardContent>
          </Card>

          <Card className="animate-fade-up stagger-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileJson aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                Payload
              </CardTitle>
              <CardDescription>提交到草稿接口的层级数据。</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[520px] overflow-auto rounded-xl border border-[var(--hairline)] bg-[var(--surface-strong)] p-4 text-xs leading-relaxed text-[var(--ink)]">
                {formatJson(fullConfigPreview)}
              </pre>
            </CardContent>
          </Card>

          {preview ? (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Copy aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                  Mutate Preview
                </CardTitle>
                <CardDescription>服务端生成的 Google Ads operations。</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[420px] overflow-auto rounded-xl border border-[var(--hairline)] bg-[var(--surface-strong)] p-4 text-xs leading-relaxed text-[var(--ink)]">
                  {formatJson(preview)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
