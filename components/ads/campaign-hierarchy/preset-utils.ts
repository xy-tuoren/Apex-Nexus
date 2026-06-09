import {
  DEVICE_OPTIONS,
  OBJECTIVE_OPTIONS,
  SCHEDULE_DAYS,
} from "@/components/ads/campaign-hierarchy/constants";
import {
  buildDefaultCampaign,
  buildPresetPayloadFromCampaign,
  formatHour,
  formatSiteLabel,
  formatStableDateTimeToMinute,
  isAllDevicesSelected,
  labelForOptionValue,
  rangesFromHours,
  splitLines,
  splitMultiline,
  summarizeGeoLocation,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type { GeoTargetOption } from "@/components/ads/campaign-hierarchy/types";
import type { CampaignPreset, CampaignPresetPayload, Site } from "@/lib/types";

export type PresetEditorState = {
  description: string;
  id?: string;
  mode: "create" | "edit";
  name: string;
  payload: CampaignPresetPayload;
  siteId: string;
};

export type PresetScheduleTag = {
  key: string;
  label: string;
};

export type PresetDeviceTag = {
  key: string;
  label: string;
};

export type PresetTableRow = {
  id: string;
  name: string;
  description?: string;
  siteLabel: string;
  campaignObjectiveLabel: string;
  bidding: string;
  budget: string;
  campaignNameSuffix?: string;
  scheduleTags: PresetScheduleTag[];
  deviceTags: PresetDeviceTag[];
  locationLabel: string;
  shortHeadlines: string[];
  longHeadlines: string[];
  adDescriptions: string[];
  updatedAt: string;
};

export const SCHEDULE_DAY_TAG_TONES = {
  MONDAY: "blue",
  TUESDAY: "green",
  WEDNESDAY: "amber",
  THURSDAY: "violet",
  FRIDAY: "rose",
  SATURDAY: "neutral",
  SUNDAY: "blue",
  unset: "neutral",
} as const;

export const DEVICE_TAG_TONES = {
  all: "neutral",
  DESKTOP: "blue",
  MOBILE: "green",
  TABLET: "amber",
  CONNECTED_TV: "violet",
} as const;

export const PRESET_TABLE_HEAD_CLASS =
  "whitespace-nowrap px-3 py-2.5 text-center text-xs font-semibold text-[var(--muted)]";

export function clonePresetPayload(payload: CampaignPresetPayload): CampaignPresetPayload {
  return {
    ...payload,
    os: [...payload.os],
    devices: [...payload.devices],
    adSchedule: Object.fromEntries(
      Object.entries(payload.adSchedule).map(([day, hours]) => [day, [...hours]]),
    ),
    adGroups: payload.adGroups.map((group) => ({
      ...group,
      genders: [...group.genders],
      ageRanges: [...group.ageRanges],
      ads: group.ads.map((ad) => ({ ...ad })),
    })),
  };
}

export function defaultPresetPayload(): CampaignPresetPayload {
  return buildPresetPayloadFromCampaign(buildDefaultCampaign(1));
}

function formatPresetBiddingValue(payload: CampaignPresetPayload) {
  if (payload.campaignObjective === "CONVERSIONS") {
    if (payload.biddingType === "TARGET_CPA") {
      return payload.targetCpa?.trim() || "-";
    }
    return "-";
  }

  if (payload.clickBiddingType === "MAX_CPC") {
    return payload.targetCpc?.trim() || "-";
  }

  return "-";
}

function resolvePresetCampaignObjectiveLabel(campaignObjective: string) {
  return OBJECTIVE_OPTIONS.find((option) => option.value === campaignObjective)?.label ?? campaignObjective;
}

function buildDeviceTags(devices: string[]): PresetDeviceTag[] {
  if (isAllDevicesSelected(devices)) {
    return [{ key: "all", label: "全部" }];
  }

  return devices.map((value) => ({
    key: value,
    label: labelForOptionValue(value, DEVICE_OPTIONS),
  }));
}

function buildScheduleTags(schedule: CampaignPresetPayload["adSchedule"]): PresetScheduleTag[] {
  const tags = SCHEDULE_DAYS.flatMap((day) => {
    const ranges = rangesFromHours(schedule[day.key] ?? []);
    if (ranges.length === 0) {
      return [];
    }

    return [
      {
        key: day.key,
        label: `${day.label} ${ranges
          .map(([start, end]) => `${formatHour(start)}-${formatHour(end)}`)
          .join("、")}`,
      },
    ];
  });

  return tags.length > 0 ? tags : [{ key: "unset", label: "未设置" }];
}

export function buildPresetTableRows(
  presets: CampaignPreset[],
  geoTargets: GeoTargetOption[],
  sites: Site[] = [],
): PresetTableRow[] {
  const siteMap = new Map(sites.map((site) => [site.id, site]));
  return presets.map((preset) => {
    const firstGroup = preset.payload.adGroups[0];
    const firstAd = firstGroup?.ads[0];
    const site = preset.siteId ? siteMap.get(preset.siteId) : null;

    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      siteLabel: site ? formatSiteLabel(site) : "-",
      campaignObjectiveLabel: resolvePresetCampaignObjectiveLabel(preset.payload.campaignObjective),
      bidding: formatPresetBiddingValue(preset.payload),
      budget: preset.payload.budgetDaily?.trim() || "-",
      campaignNameSuffix: preset.payload.campaignNameSuffix?.trim() || undefined,
      deviceTags: buildDeviceTags(preset.payload.devices),
      scheduleTags: buildScheduleTags(preset.payload.adSchedule),
      locationLabel: firstGroup ? summarizeGeoLocation(firstGroup.locations, geoTargets) : "-",
      shortHeadlines: firstAd ? splitLines(firstAd.shortHeadlines) : [],
      longHeadlines: firstAd ? splitLines(firstAd.longHeadlines) : [],
      adDescriptions: firstAd ? splitMultiline(firstAd.descriptions) : [],
      updatedAt: formatStableDateTimeToMinute(preset.updatedAt),
    };
  });
}
