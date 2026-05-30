import type { CampaignDraft, GoogleAdAccount } from "@/lib/types";
import {
  adGroup,
  asset,
  assetGroup,
  campaign,
  campaignBudget,
} from "@/server/google-ads/resource-names";

type MutateOperation = Record<string, unknown>;

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
  return {
    assetOperation: {
      create: {
        resourceName: asset(customerId, id),
        name,
        imageAsset: {
          data: `{download-and-base64:${url}}`,
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
      return { targetCpa: { targetCpaMicros: draft.bidding.targetCpaMicros } };
    case "TARGET_ROAS":
      return { targetRoas: { targetRoas: draft.bidding.targetRoas } };
    case "MAXIMIZE_CONVERSIONS":
    default:
      return { maximizeConversions: {} };
  }
}

export function buildPMaxMutateOperations(
  draft: CampaignDraft,
  adAccount: GoogleAdAccount,
): MutateOperation[] {
  const customerId = adAccount.customerId;
  const operations: MutateOperation[] = [];
  const budgetResource = campaignBudget(customerId, -1);
  const campaignResource = campaign(customerId, -2);
  const assetGroupResource = assetGroup(customerId, -3);
  let tempId = -10;
  const assetRefs: { resourceName: string; fieldType: string }[] = [];

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
        containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
      },
    },
  });

  const addTextAssets = (texts: string[], fieldType: string) => {
    texts.forEach((text) => {
      const id = tempId--;
      operations.push(textAssetOperation(customerId, id, text));
      assetRefs.push({ resourceName: asset(customerId, id), fieldType });
    });
  };

  addTextAssets(draft.assets.headlines, "HEADLINE");
  addTextAssets(draft.assets.longHeadlines, "LONG_HEADLINE");
  addTextAssets(draft.assets.descriptions, "DESCRIPTION");
  addTextAssets([draft.assets.businessName], "BUSINESS_NAME");

  draft.assets.marketingImages.forEach((url, index) => {
    const id = tempId--;
    operations.push(imageAssetOperation(customerId, id, url, `Marketing image ${index + 1}`));
    assetRefs.push({ resourceName: asset(customerId, id), fieldType: "MARKETING_IMAGE" });
  });

  draft.assets.squareMarketingImages.forEach((url, index) => {
    const id = tempId--;
    operations.push(imageAssetOperation(customerId, id, url, `Square image ${index + 1}`));
    assetRefs.push({ resourceName: asset(customerId, id), fieldType: "SQUARE_MARKETING_IMAGE" });
  });

  draft.assets.logos.forEach((url, index) => {
    const id = tempId--;
    operations.push(imageAssetOperation(customerId, id, url, `Logo ${index + 1}`));
    assetRefs.push({ resourceName: asset(customerId, id), fieldType: "LOGO" });
  });

  operations.push({
    assetGroupOperation: {
      create: {
        resourceName: assetGroupResource,
        campaign: campaignResource,
        name: `${draft.name} Asset Group`,
        finalUrls: [draft.finalUrl],
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
  const adGroupResource = adGroup(customerId, -3);
  let tempId = -10;
  const imageAssetRefs: string[] = [];
  const logoAssetRefs: string[] = [];
  const videoAssetRefs: string[] = [];

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
        containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
      },
    },
  });

  operations.push({
    adGroupOperation: {
      create: {
        resourceName: adGroupResource,
        name: draft.demandGen?.adGroupName ?? `${draft.name} Ad Group`,
        campaign: campaignResource,
        status: "ENABLED",
        demandGenAdGroupSettings: {
          channelControls: {
            selectedChannels: draft.demandGen?.selectedChannels,
          },
        },
      },
    },
  });

  draft.assets.marketingImages.forEach((url, index) => {
    const id = tempId--;
    operations.push(imageAssetOperation(customerId, id, url, `Demand image ${index + 1}`));
    imageAssetRefs.push(asset(customerId, id));
  });

  draft.assets.logos.forEach((url, index) => {
    const id = tempId--;
    operations.push(imageAssetOperation(customerId, id, url, `Demand logo ${index + 1}`));
    logoAssetRefs.push(asset(customerId, id));
  });

  draft.assets.youtubeVideos.forEach((videoId) => {
    const id = tempId--;
    operations.push(youtubeAssetOperation(customerId, id, videoId));
    videoAssetRefs.push(asset(customerId, id));
  });

  operations.push({
    adGroupAdOperation: {
      create: {
        adGroup: adGroupResource,
        status: "PAUSED",
        ad: {
          finalUrls: [draft.finalUrl],
          demandGenVideoResponsiveAd: {
            businessName: { text: draft.assets.businessName },
            headlines: draft.assets.headlines.map((text) => ({ text })),
            longHeadlines: draft.assets.longHeadlines.map((text) => ({ text })),
            descriptions: draft.assets.descriptions.map((text) => ({ text })),
            marketingImages: imageAssetRefs.map((assetRef) => ({ asset: assetRef })),
            logoImages: logoAssetRefs.map((assetRef) => ({ asset: assetRef })),
            videos: videoAssetRefs.map((assetRef) => ({ asset: assetRef })),
          },
        },
      },
    },
  });

  return operations;
}
