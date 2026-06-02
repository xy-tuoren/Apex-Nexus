import type { CampaignDraft, GoogleAdAccount } from "@/lib/types";
import {
  adGroup,
  asset,
  assetGroup,
  campaign,
  campaignBudget,
} from "@/server/google-ads/resource-names";

type MutateOperation = Record<string, unknown>;
type DraftAdGroup = NonNullable<CampaignDraft["adGroups"]>[number];
type DraftAd = DraftAdGroup["ads"][number];

function textAssetOperation(customerId: string, id: number, text: string) {
  return {
    assetOperation: {
      create: {
        resourceName: asset(customerId, id),
        textAsset: { text },
      },
    },
  };
}

function imageAssetOperation(customerId: string, id: number, url: string, name: string) {
  const dataUrlMatch = url.match(/^data:[^;]+;base64,(.+)$/);

  return {
    assetOperation: {
      create: {
        resourceName: asset(customerId, id),
        name,
        imageAsset: {
          data: dataUrlMatch?.[1] ?? `{download-and-base64:${url}}`,
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

function campaignBidding(draft: CampaignDraft) {
  switch (draft.bidding.strategy) {
    case "MAXIMIZE_CONVERSION_VALUE":
      return { maximizeConversionValue: { targetRoas: draft.bidding.targetRoas } };
    case "TARGET_CPA":
      return { maximizeConversions: { targetCpaMicros: draft.bidding.targetCpaMicros } };
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
    selectedChannels: draft.demandGen?.selectedChannels,
    ads: [
      {
        name: `${draft.name} Ad`,
        finalUrl: draft.finalUrl,
        youtubeVideos: draft.assets.youtubeVideos,
        logos: draft.assets.logos,
        headlines: draft.assets.headlines,
        longHeadlines: draft.assets.longHeadlines,
        descriptions: draft.assets.descriptions,
        callToAction: "SHOP_NOW",
        businessName: draft.assets.businessName,
      },
    ],
  };
}

function draftAdGroups(draft: CampaignDraft) {
  return draft.adGroups?.length ? draft.adGroups : [legacyAdGroup(draft)];
}

function campaignLocationOperations(campaignResource: string, groups: DraftAdGroup[]) {
  const locations = Array.from(
    new Set(
      groups
        .flatMap((group) => group.locations)
        .filter((location) => location.startsWith("geoTargetConstants/")),
    ),
  );

  return locations.map((location) => ({
    campaignCriterionOperation: {
      create: {
        campaign: campaignResource,
        location: {
          geoTargetConstant: location,
        },
      },
    },
  }));
}

function campaignLanguageOperations(campaignResource: string, groups: DraftAdGroup[]) {
  const languages = Array.from(
    new Set(
      groups
        .map((group) => group.language)
        .filter((language) => language.startsWith("languageConstants/")),
    ),
  );

  return languages.map((language) => ({
    campaignCriterionOperation: {
      create: {
        campaign: campaignResource,
        language: {
          languageConstant: language,
        },
      },
    },
  }));
}

export function buildPMaxMutateOperations(
  draft: CampaignDraft,
  adAccount: GoogleAdAccount,
): MutateOperation[] {
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
        advertisingChannelType: "PERFORMANCE_MAX",
        status: "PAUSED",
        campaignBudget: budgetResource,
        ...campaignBidding(draft),
        ...(draft.trackingTemplate ? { trackingUrlTemplate: draft.trackingTemplate } : {}),
        ...(draft.finalUrlSuffix ? { finalUrlSuffix: draft.finalUrlSuffix } : {}),
        containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
      },
    },
  });

  const addTextAssets = (
    texts: string[],
    fieldType: string,
    assetRefs: { resourceName: string; fieldType: string }[],
  ) => {
    texts.forEach((text) => {
      const id = tempId--;
      operations.push(textAssetOperation(customerId, id, text));
      assetRefs.push({ resourceName: asset(customerId, id), fieldType });
    });
  };

  const groups = draftAdGroups(draft);
  operations.push(...campaignLocationOperations(campaignResource, groups));
  operations.push(...campaignLanguageOperations(campaignResource, groups));

  groups.forEach((group, groupIndex) => {
    const assetGroupResource = assetGroup(customerId, -3 - groupIndex);
    const assetRefs: { resourceName: string; fieldType: string }[] = [];
    const finalUrls = Array.from(new Set(group.ads.map((ad) => ad.finalUrl)));

    group.ads.forEach((ad) => {
      addTextAssets(ad.headlines, "HEADLINE", assetRefs);
      addTextAssets(ad.longHeadlines, "LONG_HEADLINE", assetRefs);
      addTextAssets(ad.descriptions, "DESCRIPTION", assetRefs);
      addTextAssets([ad.businessName], "BUSINESS_NAME", assetRefs);

      ad.logos.forEach((url, index) => {
        const id = tempId--;
        operations.push(imageAssetOperation(customerId, id, url, `${ad.name} logo ${index + 1}`));
        assetRefs.push({ resourceName: asset(customerId, id), fieldType: "LOGO" });
      });
    });

    operations.push({
      assetGroupOperation: {
        create: {
          resourceName: assetGroupResource,
          campaign: campaignResource,
          name: group.name,
          finalUrls: finalUrls.length ? finalUrls : [draft.finalUrl],
          status: "PAUSED",
        },
      },
    });

    assetRefs.forEach((ref) => {
      operations.push({
        assetGroupAssetOperation: {
          create: {
            assetGroup: assetGroupResource,
            asset: ref.resourceName,
            fieldType: ref.fieldType,
          },
        },
      });
    });
  });

  return operations;
}

export function buildDemandGenMutateOperations(
  draft: CampaignDraft,
  adAccount: GoogleAdAccount,
): MutateOperation[] {
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

  const addAssetsForAd = (ad: DraftAd) => {
    const logoAssetRefs: string[] = [];
    const videoAssetRefs: string[] = [];

    ad.logos.forEach((url, index) => {
      const id = tempId--;
      operations.push(imageAssetOperation(customerId, id, url, `${ad.name} logo ${index + 1}`));
      logoAssetRefs.push(asset(customerId, id));
    });

    ad.youtubeVideos.forEach((videoId) => {
      const id = tempId--;
      operations.push(youtubeAssetOperation(customerId, id, videoId));
      videoAssetRefs.push(asset(customerId, id));
    });

    return { logoAssetRefs, videoAssetRefs };
  };

  const groups = draftAdGroups(draft);
  operations.push(...campaignLocationOperations(campaignResource, groups));
  operations.push(...campaignLanguageOperations(campaignResource, groups));

  groups.forEach((group, groupIndex) => {
    const adGroupResource = adGroup(customerId, -3 - groupIndex);

    operations.push({
      adGroupOperation: {
        create: {
          resourceName: adGroupResource,
          name: group.name,
          campaign: campaignResource,
          status: "ENABLED",
          demandGenAdGroupSettings: {
            channelControls: {
              selectedChannels: group.selectedChannels ?? draft.demandGen?.selectedChannels,
            },
          },
        },
      },
    });

    group.ads.forEach((ad) => {
      const { logoAssetRefs, videoAssetRefs } = addAssetsForAd(ad);

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
                ...(ad.callToAction === "AUTO" ? {} : { callToActionText: ad.callToAction }),
              },
            },
          },
        },
      });
    });
  });

  return operations;
}
