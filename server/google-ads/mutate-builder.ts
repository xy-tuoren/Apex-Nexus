import type { CampaignDraft, GoogleAdAccount, GoogleConversionGoalPoint } from "@/lib/types";
import {
  adGroup,
  audience,
  asset,
  campaign,
  campaignBudget,
} from "@/server/google-ads/resource-names";

type MutateOperation = Record<string, unknown>;
type DraftAdGroup = NonNullable<CampaignDraft["adGroups"]>[number];
type DraftAd = DraftAdGroup["ads"][number];
type ParsedConversionGoal = { category: string; origin: string };

const AD_SCHEDULE_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DEVICE_TYPES = ["DESKTOP", "MOBILE", "TABLET", "CONNECTED_TV"];
const DEMAND_GEN_VIDEO_ASSET_AUTOMATIONS_TO_DISABLE = [
  "GENERATE_SHORTER_YOUTUBE_VIDEOS",
  "GENERATE_VERTICAL_YOUTUBE_VIDEOS",
  "GENERATE_LANDING_PAGE_PREVIEW",
];

async function imageAssetData(url: string, name: string) {
  const dataUrlMatch = url.match(/^data:[^;]+;base64,(.+)$/);
  if (dataUrlMatch) {
    return dataUrlMatch[1];
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download Google Ads image asset "${name}": ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Google Ads image asset "${name}" must resolve to an image URL.`);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

async function imageAssetOperation(customerId: string, id: number, url: string, name: string) {
  return {
    assetOperation: {
      create: {
        resourceName: asset(customerId, id),
        name,
        imageAsset: {
          data: await imageAssetData(url, name),
        },
      },
    },
  };
}

function youtubeAssetOperation(customerId: string, id: number, youtubeVideoId: string) {
  return {
    assetOperation: {
      create: {
        resourceName: asset(customerId, id),
        youtubeVideoAsset: { youtubeVideoId },
      },
    },
  };
}

function callToActionAssetOperation(customerId: string, id: number, callToAction: string) {
  return {
    assetOperation: {
      create: {
        resourceName: asset(customerId, id),
        callToActionAsset: { callToAction },
      },
    },
  };
}

function campaignBidding(draft: CampaignDraft) {
  switch (draft.bidding.strategy) {
    case "MAXIMIZE_CONVERSION_VALUE":
      return { maximizeConversionValue: { targetRoas: draft.bidding.targetRoas } };
    case "TARGET_CPA":
      return {
        targetCpa: {
          targetCpaMicros: draft.bidding.targetCpaMicros?.toString(),
        },
      };
    case "TARGET_ROAS":
      return { targetRoas: { targetRoas: draft.bidding.targetRoas } };
    case "MAXIMIZE_CLICKS":
      return draft.bidding.maxCpcBidCeilingMicros
        ? {
          maximizeClicks: {
            maxCpcBidCeilingMicros: draft.bidding.maxCpcBidCeilingMicros.toString(),
          },
        }
        : { maximizeClicks: {} };
    case "MAXIMIZE_CONVERSIONS":
    default:
      return { maximizeConversions: {} };
  }
}

function parseConversionGoal(value?: string): ParsedConversionGoal | null {
  if (!value) {
    return null;
  }

  const [category, origin] = value.split(":");
  if (!category) {
    return null;
  }

  return {
    category,
    origin: origin || "WEBSITE",
  };
}

function adScheduleHourRanges(hours: boolean[] = []) {
  const ranges: Array<{ startHour: number; endHour: number }> = [];
  let rangeStart: number | null = null;

  for (let hour = 0; hour <= 24; hour += 1) {
    const enabled = hour < 24 ? hours[hour] === true : false;
    if (enabled && rangeStart === null) {
      rangeStart = hour;
    }
    if (!enabled && rangeStart !== null) {
      ranges.push({ startHour: rangeStart, endHour: hour });
      rangeStart = null;
    }
  }

  return ranges;
}

function isFullAdSchedule(schedule?: CampaignDraft["adSchedule"]) {
  if (!schedule) {
    return true;
  }

  return AD_SCHEDULE_DAYS.every((day) => {
    const hours = schedule[day] ?? [];
    return hours.length === 24 && hours.every(Boolean);
  });
}

function campaignAdScheduleOperations(
  campaignResource: string,
  schedule?: CampaignDraft["adSchedule"],
) {
  if (!schedule || isFullAdSchedule(schedule)) {
    return [];
  }

  return AD_SCHEDULE_DAYS.flatMap((dayOfWeek) =>
    adScheduleHourRanges(schedule[dayOfWeek]).map(({ startHour, endHour }) => ({
      campaignCriterionOperation: {
        create: {
          campaign: campaignResource,
          adSchedule: {
            dayOfWeek,
            startHour,
            startMinute: "ZERO",
            endHour,
            endMinute: "ZERO",
          },
        },
      },
    })),
  );
}

function campaignDeviceOperations(campaignResource: string, devices?: string[]) {
  if (!devices || devices.length === 0) {
    return [];
  }

  const selectedDevices = new Set(devices.filter((device) => DEVICE_TYPES.includes(device)));
  if (selectedDevices.size === 0 || selectedDevices.size === DEVICE_TYPES.length) {
    return [];
  }

  return DEVICE_TYPES.filter((device) => !selectedDevices.has(device)).map((device) => ({
    campaignCriterionOperation: {
      create: {
        campaign: campaignResource,
        bidModifier: 0,
        device: {
          type: device,
        },
      },
    },
  }));
}

function campaignOperatingSystemOperations(campaignResource: string, oss?: string[]) {
  const operatingSystemVersions = Array.from(
    new Set(
      (oss ?? []).filter((os) => os.startsWith("operatingSystemVersionConstants/")),
    ),
  );

  return operatingSystemVersions.map((operatingSystemVersion) => ({
    campaignCriterionOperation: {
      create: {
        campaign: campaignResource,
        operatingSystemVersion: {
          operatingSystemVersionConstant: operatingSystemVersion,
        },
      },
    },
  }));
}

function campaignIpExclusionOperations(campaignResource: string, ipExclusions?: string[]) {
  const ipAddresses = Array.from(
    new Set((ipExclusions ?? []).map((ip) => ip.trim()).filter(Boolean)),
  );

  return ipAddresses.map((ipAddress) => ({
    campaignCriterionOperation: {
      create: {
        campaign: campaignResource,
        negative: true,
        ipBlock: {
          ipAddress,
        },
      },
    },
  }));
}

function optedOutDemandGenVideoAssetAutomationSettings() {
  return DEMAND_GEN_VIDEO_ASSET_AUTOMATIONS_TO_DISABLE.map((assetAutomationType) => ({
    assetAutomationType,
    assetAutomationStatus: "OPTED_OUT",
  }));
}

export function buildCampaignConversionGoalMutateOperations({
  draft,
  conversionGoals,
}: {
  draft: CampaignDraft;
  conversionGoals: GoogleConversionGoalPoint[];
}): MutateOperation[] {
  if (draft.campaignObjective !== "CONVERSIONS") {
    return [];
  }

  const selectedGoal = parseConversionGoal(draft.conversionGoal);

  if (!selectedGoal) {
    return [];
  }

  const mutableGoals = conversionGoals.filter((goal) => goal.resourceName);
  const selectedGoalExists = mutableGoals.some(
    (goal) => goal.category === selectedGoal.category && goal.origin === selectedGoal.origin,
  );
  if (!selectedGoalExists) {
    return [];
  }

  return mutableGoals.map((goal) => {
    const biddable =
      goal.category === selectedGoal.category && goal.origin === selectedGoal.origin;

    return {
      campaignConversionGoalOperation: {
        update: {
          resourceName: goal.resourceName,
          biddable,
        },
        updateMask: "biddable",
      },
    };
  });
}

function legacyAdGroup(draft: CampaignDraft): DraftAdGroup {
  return {
    name: draft.demandGen?.adGroupName ?? `${draft.name} Ad Group`,
    locations: draft.locations,
    language: draft.language,
    ads: [
      {
        name: `${draft.name} Ad`,
        finalUrl: draft.finalUrl,
        youtubeVideos: draft.assets.youtubeVideos,
        logos: draft.assets.logos,
        headlines: draft.assets.headlines,
        longHeadlines: draft.assets.longHeadlines,
        descriptions: draft.assets.descriptions,
        callToAction: "PLAY_NOW",
        businessName: draft.assets.businessName,
      },
    ],
  };
}

function draftAdGroups(draft: CampaignDraft) {
  return draft.adGroups?.length ? draft.adGroups : [legacyAdGroup(draft)];
}

function adGroupLocationOperations(adGroupResource: string, group: DraftAdGroup) {
  const locations = Array.from(
    new Set(
      group.locations.filter((location) => location.startsWith("geoTargetConstants/")),
    ),
  );

  return locations.map((location) => ({
    adGroupCriterionOperation: {
      create: {
        adGroup: adGroupResource,
        location: {
          geoTargetConstant: location,
        },
      },
    },
  }));
}

function adGroupLanguageOperations(adGroupResource: string, group: DraftAdGroup) {
  const languages = Array.from(
    new Set(
      [group.language].filter((language) => language.startsWith("languageConstants/")),
    ),
  );

  return languages.map((language) => ({
    adGroupCriterionOperation: {
      create: {
        adGroup: adGroupResource,
        language: {
          languageConstant: language,
        },
      },
    },
  }));
}

const ALL_GENDERS = ["FEMALE", "MALE", "UNDETERMINED"];
const AGE_RANGE_BUCKETS = [
  { value: "18", segment: { minAge: 18, maxAge: 24 } },
  { value: "25", segment: { minAge: 25, maxAge: 34 } },
  { value: "35", segment: { minAge: 35, maxAge: 44 } },
  { value: "45", segment: { minAge: 45, maxAge: 54 } },
  { value: "55", segment: { minAge: 55, maxAge: 64 } },
  { value: "65", segment: { minAge: 65 } },
];

function adGroupAudienceOperations(
  customerId: string,
  audienceId: number,
  adGroupResource: string,
  campaignName: string,
  group: DraftAdGroup,
) {
  const dimensions: Record<string, unknown>[] = [];
  const genders = Array.from(
    new Set(
      (group.demographics?.genders ?? []).filter((gender) => ALL_GENDERS.includes(gender)),
    ),
  );
  const selectedGenders = genders.filter((gender) => gender !== "UNDETERMINED");
  const includeUndeterminedGender = genders.includes("UNDETERMINED");

  if (genders.length > 0 && genders.length < ALL_GENDERS.length) {
    dimensions.push({
      gender: {
        genders: selectedGenders,
        ...(includeUndeterminedGender ? { includeUndetermined: true } : {}),
      },
    });
  }

  const ageRange = group.demographics?.ageRange;
  if (ageRange) {
    const ageRanges = AGE_RANGE_BUCKETS.filter((bucket) =>
      ageRange.ranges.includes(bucket.value),
    ).map((bucket) => bucket.segment);
    const totalAgeSelections = ageRanges.length + (ageRange.includeUnknown ? 1 : 0);

    if (totalAgeSelections > 0 && totalAgeSelections < AGE_RANGE_BUCKETS.length + 1) {
      dimensions.push({
        age: {
          ageRanges,
          ...(ageRange.includeUnknown ? { includeUndetermined: true } : {}),
        },
      });
    }
  }

  if (dimensions.length === 0) {
    return [];
  }

  const audienceResource = audience(customerId, audienceId);
  const audienceName = `${campaignName} / ${group.name} Audience`.slice(0, 255);

  return [
    {
      audienceOperation: {
        create: {
          resourceName: audienceResource,
          name: audienceName,
          description: "Demand Gen ad group audience generated from campaign draft demographics.",
          dimensions,
        },
      },
    },
    {
      adGroupCriterionOperation: {
        create: {
          adGroup: adGroupResource,
          audience: {
            audience: audienceResource,
          },
        },
      },
    },
  ];
}

export async function buildDemandGenMutateOperations(
  draft: CampaignDraft,
  adAccount: GoogleAdAccount,
): Promise<MutateOperation[]> {
  const customerId = adAccount.customerId;
  const operations: MutateOperation[] = [];
  const budgetResource = campaignBudget(customerId, -1);
  const campaignResource = campaign(customerId, -2);
  let tempId = -10;

  operations.push({
    campaignBudgetOperation: {
      create: {
        resourceName: budgetResource,
        name: `${draft.name} Budget`,
        amountMicros: draft.budgetMicros.toString(),
        explicitlyShared: false,
        period: "DAILY",
      },
    },
  });

  operations.push({
    campaignOperation: {
      create: {
        resourceName: campaignResource,
        name: draft.name,
        advertisingChannelType: "DEMAND_GEN",
        status: "PAUSED",
        campaignBudget: budgetResource,
        ...campaignBidding(draft),
        ...(draft.trackingTemplate ? { trackingUrlTemplate: draft.trackingTemplate } : {}),
        ...(draft.finalUrlSuffix ? { finalUrlSuffix: draft.finalUrlSuffix } : {}),
        containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
      },
    },
  });
  operations.push(...campaignAdScheduleOperations(campaignResource, draft.adSchedule));
  operations.push(...campaignDeviceOperations(campaignResource, draft.devices));
  operations.push(...campaignOperatingSystemOperations(campaignResource, draft.oss));
  operations.push(...campaignIpExclusionOperations(campaignResource, draft.ipExclusions));

  const addAssetsForAd = async (ad: DraftAd) => {
    const logoAssetRefs: string[] = [];
    const videoAssetRefs: string[] = [];
    const callToActionAssetRefs: string[] = [];

    for (const [index, url] of ad.logos.entries()) {
      const id = tempId--;
      operations.push(
        await imageAssetOperation(customerId, id, url, `${ad.name} logo ${index + 1}`),
      );
      logoAssetRefs.push(asset(customerId, id));
    }

    ad.youtubeVideos.forEach((videoId) => {
      const id = tempId--;
      operations.push(youtubeAssetOperation(customerId, id, videoId));
      videoAssetRefs.push(asset(customerId, id));
    });

    if (ad.callToAction !== "AUTO") {
      const id = tempId--;
      operations.push(callToActionAssetOperation(customerId, id, ad.callToAction));
      callToActionAssetRefs.push(asset(customerId, id));
    }

    return { logoAssetRefs, videoAssetRefs, callToActionAssetRefs };
  };

  const groups = draftAdGroups(draft);

  for (const [groupIndex, group] of groups.entries()) {
    const adGroupResource = adGroup(customerId, -3 - groupIndex);

    operations.push({
      adGroupOperation: {
        create: {
          resourceName: adGroupResource,
          name: group.name,
          campaign: campaignResource,
          status: "ENABLED",
          audienceSetting: {
            useAudienceGrouped: true,
          },
        },
      },
    });
    operations.push(...adGroupLocationOperations(adGroupResource, group));
    operations.push(...adGroupLanguageOperations(adGroupResource, group));
    operations.push(
      ...adGroupAudienceOperations(customerId, tempId--, adGroupResource, draft.name, group),
    );

    for (const ad of group.ads) {
      const { logoAssetRefs, videoAssetRefs, callToActionAssetRefs } = await addAssetsForAd(ad);

      operations.push({
        adGroupAdOperation: {
          create: {
            adGroup: adGroupResource,
            status: "PAUSED",
            adGroupAdAssetAutomationSettings: optedOutDemandGenVideoAssetAutomationSettings(),
            ad: {
              name: ad.name,
              finalUrls: [ad.finalUrl],
              demandGenVideoResponsiveAd: {
                businessName: { text: ad.businessName },
                headlines: ad.headlines.map((text) => ({ text })),
                longHeadlines: ad.longHeadlines.map((text) => ({ text })),
                descriptions: ad.descriptions.map((text) => ({ text })),
                logoImages: logoAssetRefs.map((assetRef) => ({ asset: assetRef })),
                videos: videoAssetRefs.map((assetRef) => ({ asset: assetRef })),
                ...(callToActionAssetRefs.length
                  ? {
                    callToActions: callToActionAssetRefs.map((assetRef) => ({
                      asset: assetRef,
                    })),
                  }
                  : {}),
              },
            },
          },
        },
      });
    }
  }

  return operations;
}
