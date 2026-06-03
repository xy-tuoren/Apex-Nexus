"use client";

import { Input } from "@/components/ui/input";
import { SelectControl } from "@/components/ads/campaign-hierarchy/field-controls";
import { AssetInputList, LogoUploadList, VideoLinkList } from "@/components/ads/campaign-hierarchy/field-controls";
import { CTA_OPTIONS } from "@/components/ads/campaign-hierarchy/constants";
import type { AdForm, AdGroupForm, CampaignForm } from "@/components/ads/campaign-hierarchy/types";

interface AdEditorFormProps {
  campaign: CampaignForm;
  group: AdGroupForm;
  ad: AdForm;
  // Mutation handlers
  updateCampaignAd: (
    campaignId: string,
    groupId: string,
    adId: string,
    patch: Partial<AdForm>
  ) => void;
}

export function AdEditorForm({ campaign, group, ad, updateCampaignAd }: AdEditorFormProps) {
  return (
    <div className="grid gap-3">
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">广告名称</label>
        <Input
          className="min-w-0"
          value={ad.name}
          onChange={(event) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { name: event.target.value })
          }
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">商家名称</label>
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
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">最终到达网址</label>
        <Input
          className="min-w-0"
          value={ad.finalUrl}
          onChange={(event) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { finalUrl: event.target.value })
          }
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">号召性用语文字</label>
        <SelectControl
          className="min-w-0 w-full"
          options={CTA_OPTIONS.map(([value, label]) => ({ value, label }))}
          value={ad.callToAction}
          onChange={(callToAction) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { callToAction })
          }
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">视频素材链接</label>
        <VideoLinkList
          key={`${ad.id}:videoLinks`}
          value={ad.videoLinks}
          onChange={(videoLinks) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { videoLinks })
          }
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">徽标</label>
        <LogoUploadList
          value={ad.logos}
          onChange={(logos) => updateCampaignAd(campaign.id, group.id, ad.id, { logos })}
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">短标题</label>
        <AssetInputList
          key={`${ad.id}:shortHeadlines`}
          maxLength={40}
          placeholder="输入短标题"
          value={ad.shortHeadlines}
          onChange={(shortHeadlines) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { shortHeadlines })
          }
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">长标题</label>
        <AssetInputList
          key={`${ad.id}:longHeadlines`}
          maxLength={90}
          placeholder="输入长标题"
          value={ad.longHeadlines}
          onChange={(longHeadlines) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { longHeadlines })
          }
        />
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">广告内容描述</label>
        <AssetInputList
          key={`${ad.id}:descriptions`}
          maxLength={90}
          placeholder="输入描述"
          value={ad.descriptions}
          onChange={(descriptions) =>
            updateCampaignAd(campaign.id, group.id, ad.id, { descriptions })
          }
        />
      </div>
    </div>
  );
}