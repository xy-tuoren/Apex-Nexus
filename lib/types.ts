export type AdvertisingType = "PERFORMANCE_MAX" | "DEMAND_GEN";

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
  currencyCode: string;
  timeZone: string;
  status: "ENABLED" | "PAUSED" | "UNKNOWN";
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

export type CampaignDraft = {
  id: string;
  siteId: string;
  adAccountId: string;
  advertisingType: AdvertisingType;
  name: string;
  finalUrl: string;
  budgetMicros: number;
  bidding: {
    strategy:
      | "MAXIMIZE_CONVERSIONS"
      | "MAXIMIZE_CONVERSION_VALUE"
      | "TARGET_CPA"
      | "TARGET_ROAS";
    targetCpaMicros?: number;
    targetRoas?: number;
  };
  locations: string[];
  language: string;
  assets: {
    headlines: string[];
    longHeadlines: string[];
    descriptions: string[];
    businessName: string;
    marketingImages: string[];
    squareMarketingImages: string[];
    logos: string[];
    youtubeVideos: string[];
  };
  demandGen?: {
    adGroupName: string;
    selectedChannels: {
      youtubeInFeed: boolean;
      youtubeInStream: boolean;
      youtubeShorts: boolean;
      discover: boolean;
      gmail: boolean;
      display: boolean;
    };
  };
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
