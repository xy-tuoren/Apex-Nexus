"use client";

import { Badge } from "@/components/ui/badge";
import {
  BIDDING_TYPE_OPTIONS,
  CLICK_BIDDING_TYPE_OPTIONS,
  CTA_OPTIONS,
  OBJECTIVE_OPTIONS,
} from "@/components/ads/campaign-hierarchy/constants";
import {
  buildCampaignHighlights,
  formatSchedule,
  splitLines,
  splitMultiline,
  summarizeGeoLocation,
  summarizeLanguageValue,
  summarizeOsDevice,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { GoogleAdAccount } from "@/lib/types";

function summarizeCampaignBidding(campaign: CampaignForm) {
  if (campaign.campaignObjective === "CONVERSIONS") {
    const label = BIDDING_TYPE_OPTIONS.find((option) => option.value === campaign.biddingType)?.label;
    if (campaign.biddingType === "TARGET_CPA" && campaign.targetCpa) {
      return `${label} ${campaign.targetCpa}`;
    }
    return label ?? campaign.biddingType;
  }

  const label = CLICK_BIDDING_TYPE_OPTIONS.find((option) => option.value === campaign.clickBiddingType)?.label;
  if (campaign.clickBiddingType === "MAX_CPC" && campaign.targetCpc) {
    return `${label} ${campaign.targetCpc}`;
  }
  return label ?? campaign.clickBiddingType;
}

function PreviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] px-3 py-2.5">
      <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-base font-semibold tracking-[-0.02em] text-[var(--ink)]" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-2">
      <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-sm text-[var(--ink)]" title={value}>
        {value}
      </p>
    </div>
  );
}

function textCount(value: string) {
  return splitLines(value).length;
}

type CampaignPreviewProps = {
  campaign: CampaignForm;
  account?: GoogleAdAccount;
  geoTargets: GeoTargetOption[];
  languageTargets: LanguageTargetOption[];
};

export function CampaignPreview({
  campaign,
  account,
  geoTargets,
  languageTargets,
}: CampaignPreviewProps) {
  const highlights = buildCampaignHighlights(campaign, geoTargets, languageTargets);
  const objectiveLabel = OBJECTIVE_OPTIONS.find((option) => option.value === campaign.campaignObjective)?.label;
  const allAds = campaign.adGroups.flatMap((group) => group.ads);
  const videoCount = allAds.reduce((total, ad) => total + textCount(ad.videoLinks), 0);
  const shortHeadlineCount = allAds.reduce((total, ad) => total + textCount(ad.shortHeadlines), 0);
  const longHeadlineCount = allAds.reduce((total, ad) => total + textCount(ad.longHeadlines), 0);
  const descriptionCount = allAds.reduce((total, ad) => total + textCount(ad.descriptions), 0);
  const logoCount = allAds.reduce((total, ad) => total + splitMultiline(ad.logos).length, 0);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption-uppercase text-[var(--muted)]">Campaign Preview</p>
            <h3 className="mt-1 truncate text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]" title={campaign.campaignName}>
              {campaign.campaignName}
            </h3>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">
              {account ? `${account.name} · ${account.customerId}` : "未选择投放账号"}
            </p>
          </div>
          <Badge className="normal-case tracking-normal">{campaign.advertisingType}</Badge>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <PreviewMetric label="目标" value={objectiveLabel ?? campaign.campaignObjective} />
          <PreviewMetric label="出价" value={summarizeCampaignBidding(campaign)} />
          <PreviewMetric label="日预算" value={campaign.budgetDaily || "未填"} />
          <PreviewMetric label="结构" value={`${campaign.adGroups.length} 组 / ${allAds.length} 广告`} />
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <InfoLine label="设备" value={summarizeOsDevice(campaign.os, campaign.devices)} />
          <InfoLine label="投放时间" value={formatSchedule(campaign.adSchedule)} />
          <InfoLine label="URL 后缀" value={campaign.finalUrlSuffix || "未设置"} />
          <InfoLine label="排除 IP" value={splitLines(campaign.ipExclusions).join(" / ") || "未设置"} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <PreviewMetric label="视频" value={videoCount} />
          <PreviewMetric label="短标题" value={shortHeadlineCount} />
          <PreviewMetric label="长标题" value={longHeadlineCount} />
          <PreviewMetric label="描述" value={descriptionCount} />
          <PreviewMetric label="徽标" value={logoCount} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {highlights.map((line, index) => (
            <Badge key={`${line}-${index}`} className="max-w-full normal-case tracking-normal" variant="outline">
              <span className="truncate">{line}</span>
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {campaign.adGroups.map((group, groupIndex) => (
          <div key={group.id} className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 px-4 py-3">
                <p className="text-caption-uppercase text-[var(--muted)]">
                  AdGroup {String(groupIndex + 1).padStart(2, "0")}
                </p>
                <h4 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]" title={group.name}>
                  {group.name}
                </h4>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {summarizeGeoLocation(group.locations, geoTargets)} · {summarizeLanguageValue(group.language, languageTargets)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 px-4 py-3">
                <Badge className="normal-case tracking-normal">{group.ads.length} Ads</Badge>
                <Badge className="normal-case tracking-normal" variant="outline">
                  性别 {group.genders.length || 0}
                </Badge>
                <Badge className="normal-case tracking-normal" variant="outline">
                  年龄 {group.ageRanges.length + (group.includeUnknownAge ? 1 : 0)}
                </Badge>
              </div>
            </div>
            <div className="grid gap-0 border-t border-[var(--hairline)]">
              {group.ads.map((ad, adIndex) => (
                <div key={ad.id} className="grid gap-3 border-b border-[var(--hairline)] px-4 py-3 last:border-b-0 lg:grid-cols-[1.1fr_1.4fr_1.2fr]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Ad {String(adIndex + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-[var(--ink)]" title={ad.name}>
                      {ad.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]" title={ad.finalUrl}>
                      {ad.finalUrl || "未填最终 URL"}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">
                      {ad.businessName || "未填商家"} · {CTA_OPTIONS.find((option) => option[0] === ad.callToAction)?.[1] ?? ad.callToAction}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs leading-relaxed text-[var(--body)]" title={splitLines(ad.shortHeadlines).join(" / ")}>
                      短标题：{splitLines(ad.shortHeadlines).slice(0, 5).join(" / ") || "未填"}
                    </p>
                    <p className="mt-1 truncate text-xs leading-relaxed text-[var(--body)]" title={splitLines(ad.longHeadlines).join(" / ")}>
                      长标题：{splitLines(ad.longHeadlines).slice(0, 3).join(" / ") || "未填"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--body)]" title={splitLines(ad.descriptions).join(" / ")}>
                      内容：{splitLines(ad.descriptions).slice(0, 4).join(" / ") || "未填"}
                    </p>
                  </div>
                  <div className="grid min-w-0 grid-cols-2 gap-2 text-xs">
                    <InfoLine label="视频" value={`${textCount(ad.videoLinks)} 条`} />
                    <InfoLine label="徽标" value={`${splitMultiline(ad.logos).length} 张`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
