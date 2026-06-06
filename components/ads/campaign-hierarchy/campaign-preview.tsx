"use client";

import { Badge } from "@/components/ui/badge";
import {
  BIDDING_TYPE_OPTIONS,
  CLICK_BIDDING_TYPE_OPTIONS,
  OBJECTIVE_OPTIONS,
} from "@/components/ads/campaign-hierarchy/constants";
import {
  buildCampaignHighlights,
  formatSchedule,
  splitLines,
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

  return (
    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-3xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4">
        <p className="text-caption-uppercase text-[var(--muted)]">Campaign Snapshot</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{campaign.campaignName}</h3>
        <div className="mt-4 grid gap-2 text-sm text-[var(--body)]">
          <p>账号：{account ? `${account.name} · ${account.customerId}` : "未选择"}</p>
          <p>目标：{objectiveLabel}</p>
          <p>预算：{campaign.budgetDaily} / day</p>
          <p>出价：{summarizeCampaignBidding(campaign)}</p>
          <p>设备：{summarizeOsDevice(campaign.os, campaign.devices)}</p>
          <p>时间：{formatSchedule(campaign.adSchedule)}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
          <p className="text-xs font-semibold text-[var(--ink)]">投放摘要</p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[var(--body)]">
            {highlights.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="space-y-3">
        {campaign.adGroups.map((group, groupIndex) => (
          <div key={group.id} className="rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-caption-uppercase text-[var(--muted)]">
                  AdGroup {String(groupIndex + 1).padStart(2, "0")}
                </p>
                <h4 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">{group.name}</h4>
              </div>
              <Badge className="normal-case tracking-normal">{group.ads.length} Ads</Badge>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.ads.map((ad, adIndex) => (
                <div key={ad.id} className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Ad {String(adIndex + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{ad.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--body)]">
                    {splitLines(ad.shortHeadlines).slice(0, 2).join(" / ")}
                  </p>
                  <p className="mt-2 truncate text-[11px] text-[var(--muted)]">{ad.finalUrl}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
