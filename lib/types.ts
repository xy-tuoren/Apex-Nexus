export type AdvertisingType = "DEMAND_GEN";

export type CampaignStatus = "DRAFT" | "PAUSED" | "ENABLED" | "REMOVED";

export type LaunchJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type GoogleAccountKind = "DATA_MCC" | "OPERATION_MCC" | "AD_ACCOUNT";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  nextActions?: string[];
};

export type GoogleMccAccount = {
  id: string;
  customerId: string;
  name: string;
  kind: Extract<GoogleAccountKind, "DATA_MCC" | "OPERATION_MCC">;
  parentCustomerId?: string;
  canManageClients: boolean;
  lastSyncedAt?: string;
};

export type GoogleAdAccount = {
  id: string;
  customerId: string;
  name: string;
  operationMccId: string;
  loginCustomerId?: string;
  currencyCode: string;
  timeZone: string;
  status: "ENABLED" | "PAUSED" | "UNKNOWN";
};

export type GoogleConversionGoalPoint = {
  id: string;
  resourceName?: string;
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

export type GoogleConversionGoalSet = {
  id: string;
  mccAccountId: string;
  customerId: string;
  loginCustomerId: string;
  goals: GoogleConversionGoalPoint[];
  syncedAt: string;
};

export type Site = {
  id: string;
  name: string;
  domain: string;
  brandName: string;
  defaultFinalUrl: string;
  defaultLanguage: string;
  defaultLocations: string[];
  operationMccId: string;
  dailyBudgetLimitMicros: number;
};

export type SiteAdAccount = {
  siteId: string;
  adAccountId: string;
};

export type CreativeAsset = {
  id: string;
  siteId: string;
  name: string;
  type: "TEXT" | "IMAGE" | "LOGO" | "YOUTUBE_VIDEO";
  text?: string;
  url?: string;
  youtubeVideoId?: string;
  width?: number;
  height?: number;
  validationStatus: "VALID" | "INVALID" | "PENDING";
  createdAt: string;
};

export type AdCreativeDraft = {
  id?: string;
  name: string;
  finalUrl: string;
  youtubeVideos: string[];
  logos: string[];
  headlines: string[];
  longHeadlines: string[];
  descriptions: string[];
  callToAction: string;
  businessName: string;
};

export type AdGroupDraft = {
  id?: string;
  name: string;
  locations: string[];
  language: string;
  demographics?: {
    genders: string[];
    ageRange: {
      ranges: string[];
      includeUnknown: boolean;
    };
  };
  ads: AdCreativeDraft[];
};

export type GoogleAdSchedule = Record<string, boolean[]>;

export type CampaignDraft = {
  id: string;
  siteId?: string;
  adAccountId: string;
  advertisingType: AdvertisingType;
  name: string;
  campaignObjective?: string;
  conversionGoal?: string;
  finalUrl: string;
  budgetMicros: number;
  bidding: {
    strategy:
      | "MAXIMIZE_CONVERSIONS"
      | "MAXIMIZE_CLICKS"
      | "MAXIMIZE_CONVERSION_VALUE"
      | "TARGET_CPA"
      | "TARGET_ROAS";
    targetCpaMicros?: number;
    maxCpcBidCeilingMicros?: number;
    targetRoas?: number;
  };
  locations: string[];
  language: string;
  os?: string;
  oss?: string[];
  device?: string;
  devices?: string[];
  adSchedule?: GoogleAdSchedule;
  trackingTemplate?: string;
  finalUrlSuffix?: string;
  ipExclusions?: string[];
  assets: {
    headlines: string[];
    longHeadlines: string[];
    descriptions: string[];
    businessName: string;
    logos: string[];
    youtubeVideos: string[];
  };
  demandGen?: {
    adGroupName: string;
  };
  adGroups?: AdGroupDraft[];
  status: "DRAFT" | "VALIDATED" | "SUBMITTED";
  createdAt: string;
  updatedAt: string;
};

export type GoogleCampaignBinding = {
  id: string;
  draftId: string;
  adAccountId: string;
  advertisingType: AdvertisingType;
  campaignResourceName: string;
  budgetResourceName?: string;
  assetGroupResourceName?: string;
  adGroupResourceName?: string;
  adGroupAdResourceName?: string;
  assetResourceNames: string[];
  status: CampaignStatus;
  createdAt: string;
};

export type LaunchJob = {
  id: string;
  draftId: string;
  idempotencyKey: string;
  status: LaunchJobStatus;
  error?: ApiError;
  result?: GoogleCampaignBinding;
  googleAdsRequest?: unknown;
  googleAdsResponse?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type DraftValidationResult = {
  draftId: string;
  valid: boolean;
  errors: ApiError[];
  warnings: ApiError[];
  checkedAt: string;
};

export type CampaignMetricsDaily = {
  campaignBindingId: string;
  date: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionValue: number;
};
