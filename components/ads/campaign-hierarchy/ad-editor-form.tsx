"use client";

import { EditorSidebar } from "@/components/ads/campaign-hierarchy/editor-sidebar";
import { Input } from "@/components/ui/input";
import { SelectControl } from "@/components/ads/campaign-hierarchy/field-controls";
import { AssetInputList, LogoUploadList, VideoLinkList } from "@/components/ads/campaign-hierarchy/field-controls";
import { DEMAND_GEN_AD_LIMITS } from "@/lib/google-ads/demand-gen-limits";
import {
  CTA_OPTIONS,
  editorFormCardClassName,
  editorFormStackClassName,
} from "@/components/ads/campaign-hierarchy/constants";
import { type AdErrors, type AdGroupErrors } from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  AdForm,
  AdGroupForm,
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";

function inputErrorClass(error?: string) {
  return error ? "border-[var(--semantic-error)] focus-visible:border-[var(--semantic-error)] focus-visible:ring-[var(--semantic-error)]/10" : "";
}

interface AdEditorFormProps {
  campaign: CampaignForm;
  group: AdGroupForm;
  ad: AdForm;
  hideSidebar?: boolean;
  errors?: AdErrors;
  groupErrors?: Record<string, AdGroupErrors>;
  adErrors?: Record<string, AdErrors>;
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
  removeAdGroup: (campaignId: string, groupId: string) => void;
  removeAd: (campaignId: string, groupId: string, adId: string) => void;
  openAdGroupEditor: (campaignId: string, groupId: string) => void;
  openAdEditor: (campaignId: string, groupId: string, adId: string) => void;
  onOpenCampaign?: () => void;
}

export function AdEditorForm({
  campaign,
  group,
  ad,
  hideSidebar,
  errors = {},
  groupErrors = {},
  adErrors = {},
  geoTargets,
  languageTargets,
  updateCampaignAd,
  addAd,
  duplicateAdGroup,
  duplicateAd,
  removeAdGroup,
  removeAd,
  openAdGroupEditor,
  openAdEditor,
  onOpenCampaign,
}: AdEditorFormProps) {
  return (
    <div className={hideSidebar ? "" : "grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]"}>
      {!hideSidebar ? (
        <div className="xl:sticky xl:top-0 xl:self-start">
          <EditorSidebar
            activeAdId={ad.id}
            activeGroupId={group.id}
          adErrors={adErrors}
          campaign={campaign}
          geoTargets={geoTargets}
          groupErrors={groupErrors}
          languageTargets={languageTargets}
          onAddAd={(groupId) => addAd(campaign.id, groupId)}
          onDuplicateAd={(groupId, adId) => duplicateAd(campaign.id, groupId, adId)}
          onDuplicateGroup={(groupId) => duplicateAdGroup(campaign.id, groupId)}
          onOpenCampaign={onOpenCampaign}
          onRemoveAd={(groupId, adId) => removeAd(campaign.id, groupId, adId)}
          onRemoveGroup={(groupId) => removeAdGroup(campaign.id, groupId)}
          onOpenAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
          onOpenGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
        />
      </div>
      ) : null}

      <div className={hideSidebar ? editorFormStackClassName : `${editorFormStackClassName} ${editorFormCardClassName}`}>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            广告名称<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <Input
            aria-invalid={Boolean(errors.name)}
            className={inputErrorClass(errors.name)}
            value={ad.name}
            onChange={(event) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { name: event.target.value })
            }
          />
          {errors.name ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.name}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            商家名称<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <Input
            aria-invalid={Boolean(errors.businessName)}
            className={inputErrorClass(errors.businessName)}
            maxLength={25}
            value={ad.businessName}
            onChange={(event) =>
              updateCampaignAd(campaign.id, group.id, ad.id, {
                businessName: event.target.value,
              })
            }
          />
          {errors.businessName ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.businessName}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            最终到达网址<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <Input
            aria-invalid={Boolean(errors.finalUrl)}
            className={inputErrorClass(errors.finalUrl)}
            value={ad.finalUrl}
            onChange={(event) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { finalUrl: event.target.value })
            }
          />
          {errors.finalUrl ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.finalUrl}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            号召性用语文字<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
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
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            视频素材链接<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <VideoLinkList
            key={`${ad.id}:videoLinks`}
            maxItems={DEMAND_GEN_AD_LIMITS.youtubeVideos}
            value={ad.videoLinks}
            onChange={(videoLinks) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { videoLinks })
            }
          />
          {errors.videoLinks ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.videoLinks}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            徽标<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <LogoUploadList
            maxItems={DEMAND_GEN_AD_LIMITS.logos}
            value={ad.logos}
            onChange={(logos) => updateCampaignAd(campaign.id, group.id, ad.id, { logos })}
          />
          {errors.logos ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.logos}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            短标题<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <AssetInputList
            key={`${ad.id}:shortHeadlines`}
            maxLength={40}
            maxItems={DEMAND_GEN_AD_LIMITS.headlines}
            placeholder="输入短标题"
            value={ad.shortHeadlines}
            onChange={(shortHeadlines) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { shortHeadlines })
            }
          />
          {errors.shortHeadlines ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.shortHeadlines}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            长标题<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <AssetInputList
            key={`${ad.id}:longHeadlines`}
            maxLength={90}
            maxItems={DEMAND_GEN_AD_LIMITS.longHeadlines}
            placeholder="输入长标题"
            value={ad.longHeadlines}
            onChange={(longHeadlines) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { longHeadlines })
            }
          />
          {errors.longHeadlines ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.longHeadlines}</p>
          ) : null}
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
            广告内容描述<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
          </label>
          <AssetInputList
            key={`${ad.id}:descriptions`}
            maxLength={90}
            maxItems={DEMAND_GEN_AD_LIMITS.descriptions}
            placeholder="输入描述"
            value={ad.descriptions}
            onChange={(descriptions) =>
              updateCampaignAd(campaign.id, group.id, ad.id, { descriptions })
            }
          />
          {errors.descriptions ? (
            <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.descriptions}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
