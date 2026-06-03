"use client";

import { EditorSidebar } from "@/components/ads/campaign-hierarchy/editor-sidebar";
import { Input } from "@/components/ui/input";
import { SelectControl } from "@/components/ads/campaign-hierarchy/field-controls";
import { AssetInputList, LogoUploadList, VideoLinkList } from "@/components/ads/campaign-hierarchy/field-controls";
import { CTA_OPTIONS } from "@/components/ads/campaign-hierarchy/constants";
import type {
  AdForm,
  AdGroupForm,
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";

interface AdEditorFormProps {
  campaign: CampaignForm;
  group: AdGroupForm;
  ad: AdForm;
  geoTargets: GeoTargetOption[];
  languageTargets: LanguageTargetOption[];
  // Mutation handlers
  updateCampaignAd: (
    campaignId: string,
    groupId: string,
    adId: string,
    patch: Partial<AdForm>
  ) => void;
  addAd: (campaignId: string, groupId: string) => void;
  duplicateAdGroup: (campaignId: string, groupId: string) => void;
  duplicateAd: (campaignId: string, groupId: string, adId: string) => void;
  openAdGroupEditor: (campaignId: string, groupId: string) => void;
  openAdEditor: (campaignId: string, groupId: string, adId: string) => void;
}

export function AdEditorForm({
  campaign,
  group,
  ad,
  geoTargets,
  languageTargets,
  updateCampaignAd,
  addAd,
  duplicateAdGroup,
  duplicateAd,
  openAdGroupEditor,
  openAdEditor,
}: AdEditorFormProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-0 xl:self-start">
        <EditorSidebar
          activeAdId={ad.id}
          activeGroupId={group.id}
          campaign={campaign}
          geoTargets={geoTargets}
          languageTargets={languageTargets}
          onAddAd={(groupId) => addAd(campaign.id, groupId)}
          onDuplicateAd={(groupId, adId) => duplicateAd(campaign.id, groupId, adId)}
          onDuplicateGroup={(groupId) => duplicateAdGroup(campaign.id, groupId)}
          onOpenAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
          onOpenGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
        />
      </div>

      <div className="grid gap-3 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
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
    </div>
  );
}
