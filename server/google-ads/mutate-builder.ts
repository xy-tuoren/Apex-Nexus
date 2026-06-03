import type { CampaignDraft, GoogleAdAccount } from "@/lib/types";
import {
  adGroup,
  asset,
  campaign,
  campaignBudget,
} from "@/server/google-ads/resource-names";

type MutateOperation = Record<string, unknown>;
type DraftAdGroup = NonNullable<CampaignDraft["adGroups"]>[number];
type DraftAd = DraftAdGroup["ads"][number];

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
      return { maximizeConversions: {} };
    case "TARGET_ROAS":
      return { targetRoas: { targetRoas: draft.bidding.targetRoas } };
    case "MAXIMIZE_CLICKS":
      return draft.bidding.maxCpcBidCeilingMicros
        ? { maximizeClicks: { maxCpcBidCeilingMicros: draft.bidding.maxCpcBidCeilingMicros } }
        : { maximizeClicks: {} };
    case "MAXIMIZE_CONVERSIONS":
    default:
      return { maximizeConversions: {} };
  }
}

function legacyAdGroup(draft: CampaignDraft): DraftAdGroup {
  return {
    name: draft.demandGen?.adGroupName ?? `${draft.name} Ad Group`,
    locations: draft.locations,
    audienceSignals: [],
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
  { value: "18", criterion: "AGE_RANGE_18_24" },
  { value: "25", criterion: "AGE_RANGE_25_34" },
  { value: "35", criterion: "AGE_RANGE_35_44" },
  { value: "45", criterion: "AGE_RANGE_45_54" },
  { value: "55", criterion: "AGE_RANGE_55_64" },
  { value: "65", criterion: "AGE_RANGE_65_UP" },
];

function adGroupGenderOperations(adGroupResource: string, group: DraftAdGroup) {
  const genders = Array.from(
    new Set(
      (group.demographics?.genders ?? []).filter((gender) => ALL_GENDERS.includes(gender)),
    ),
  );

  if (genders.length === 0 || genders.length === ALL_GENDERS.length) {
    return [];
  }

  return genders.map((gender) => ({
    adGroupCriterionOperation: {
      create: {
        adGroup: adGroupResource,
        gender: {
          type: gender,
        },
      },
    },
  }));
}

function adGroupAgeRangeOperations(adGroupResource: string, group: DraftAdGroup) {
  const ageRange = group.demographics?.ageRange;
  if (!ageRange) {
    return [];
  }

  const selectedAgeRanges = AGE_RANGE_BUCKETS.filter((bucket) =>
    ageRange.ranges.includes(bucket.value),
  ).map((bucket) => bucket.criterion);
  if (ageRange.includeUnknown) {
    selectedAgeRanges.push("AGE_RANGE_UNDETERMINED");
  }

  if (selectedAgeRanges.length === 0) {
    return [];
  }
  if (selectedAgeRanges.length === AGE_RANGE_BUCKETS.length + 1) {
    return [];
  }

  return selectedAgeRanges.map((type) => ({
    adGroupCriterionOperation: {
      create: {
        adGroup: adGroupResource,
        ageRange: {
          type,
        },
      },
    },
  }));
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
        },
      },
    });
    operations.push(...adGroupLocationOperations(adGroupResource, group));
    operations.push(...adGroupLanguageOperations(adGroupResource, group));
    operations.push(...adGroupGenderOperations(adGroupResource, group));
    operations.push(...adGroupAgeRangeOperations(adGroupResource, group));

    for (const ad of group.ads) {
      const { logoAssetRefs, videoAssetRefs, callToActionAssetRefs } = await addAssetsForAd(ad);

      operations.push({
        adGroupAdOperation: {
          create: {
            adGroup: adGroupResource,
            status: "PAUSED",
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
