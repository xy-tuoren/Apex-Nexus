import type {
  AdvertisingType,
  CampaignPreset,
  GoogleAdAccount,
  GoogleMccAccount,
  LaunchBatch,
  Site,
} from "@/lib/types";

export type ApiResult = {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  nextActions?: string[];
};

export type CampaignHierarchyEditorProps = {
  initialAdAccounts: GoogleAdAccount[];
  accountSyncError?: string | null;
  accountsSyncedAt?: string | null;
  initialMccAccounts?: GoogleMccAccount[];
  initialPresets?: CampaignPreset[];
  initialLaunchBatches?: LaunchBatch[];
  initialSites?: Site[];
  initialCampaignName?: string;
};

export type SyncPayload = {
  mccAccounts: GoogleMccAccount[];
  adAccounts: GoogleAdAccount[];
  syncedAt: string;
  accessibleCustomerIds: string[];
};

export type ConversionGoalPoint = {
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

export type GeoTargetOption = {
  resourceName: string;
  id: string;
  name: string;
  canonicalName: string;
  countryCode: string;
  targetType: string;
  status: string;
};

export type LanguageTargetOption = {
  resourceName: string;
  id: string;
  code: string;
  name: string;
  targetable: boolean;
};

export type AdForm = {
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

export type AdGroupForm = {
  id: string;
  name: string;
  locations: string;
  language: string;
  genders: string[];
  ageRanges: string[];
  includeUnknownAge: boolean;
  ads: AdForm[];
};

export type ScheduleGridValue = Record<string, boolean[]>;
export type BiddingType = "TARGET_CPA" | "MAXIMIZE_CONVERSIONS";
export type ClickBiddingType = "MAXIMIZE_CLICKS" | "MAX_CPC";

export type CampaignForm = {
  id: string;
  siteId: string;
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
  os: string[];
  devices: string[];
  adSchedule: ScheduleGridValue;
  finalUrlSuffix: string;
  ipExclusions: string;
  campaignNameSuffix?: string;
  adGroups: AdGroupForm[];
};

export type ExpandState = {
  campaign: boolean;
  adGroups: Record<string, boolean>;
  ads: Record<string, boolean>;
};


export type EditorFocus =
  | { level: "adgroup"; campaignId: string; groupId: string }
  | { level: "ad"; campaignId: string; groupId: string; adId: string };

/** Data URLs contain commas — only split on newlines. */
