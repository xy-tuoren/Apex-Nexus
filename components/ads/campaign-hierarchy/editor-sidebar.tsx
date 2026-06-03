"use client";

import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  summarizeAdCard,
  summarizeAdGroupCard,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";

type EditorSidebarProps = {
  campaign: CampaignForm;
  activeGroupId?: string | null;
  activeAdId?: string | null;
  geoTargets?: GeoTargetOption[];
  languageTargets?: LanguageTargetOption[];
  onOpenGroup?: (groupId: string) => void;
  onOpenAd?: (groupId: string, adId: string) => void;
  onAddGroup?: () => void;
  onAddAd?: (groupId: string) => void;
  onDuplicateGroup?: (groupId: string) => void;
  onDuplicateAd?: (groupId: string, adId: string) => void;
};

export function EditorSidebar({
  campaign,
  activeGroupId,
  activeAdId,
  geoTargets,
  languageTargets,
  onOpenGroup,
  onOpenAd,
  onAddGroup,
  onAddAd,
  onDuplicateGroup,
  onDuplicateAd,
}: EditorSidebarProps) {
  return (
    <aside className="rounded-[1.75rem] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--hairline)] px-1 pb-3">
        <div>
          <p className="text-caption-uppercase text-[var(--muted)]">导航</p>
          <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
            {campaign.adGroups.length} 个广告组
          </p>
        </div>
        {onAddGroup ? (
          <Button size="sm" type="button" variant="outline" onClick={onAddGroup}>
            <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            新增广告组
          </Button>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {campaign.adGroups.map((group, groupIndex) => {
          const isGroupActive = activeGroupId === group.id && !activeAdId;
          const hasActiveAd = activeGroupId === group.id && Boolean(activeAdId);
          const groupSummary = summarizeAdGroupCard(group, geoTargets, languageTargets)
            .replace(" 条广告", " 广告")
            .replace(" · ", " / ");

          return (
            <section
              key={group.id}
              className={cn(
                "overflow-hidden rounded-2xl border transition",
                isGroupActive || hasActiveAd
                  ? "border-[var(--ink)]/40 bg-[var(--surface-card)] ring-1 ring-[var(--ink)]/12"
                  : "border-[var(--hairline)] bg-[var(--surface-card)]",
              )}
            >
              <div
                className={cn(
                  "relative flex items-center gap-2.5 px-3 py-2.5 transition",
                  isGroupActive
                    ? "bg-[var(--surface-strong)]"
                    : onOpenGroup
                      ? "hover:bg-[var(--surface-strong)]"
                      : "",
                )}
              >
                {(isGroupActive || hasActiveAd) ? (
                  <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-[var(--ink)]/70" />
                ) : null}
                <button
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  type="button"
                  onClick={() => onOpenGroup?.(group.id)}
                >
                  <span className="module-index flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)] text-[10px] font-semibold text-[var(--ink)]">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink)]">
                        {group.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">
                        {group.ads.length} 广告
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] leading-relaxed text-[var(--muted)]">
                      {groupSummary}
                    </span>
                  </span>
                </button>
                {onDuplicateGroup ? (
                  <Button
                    aria-label={`复制广告组 ${group.name}`}
                    className="h-7 w-7 shrink-0 px-0"
                    size="sm"
                    title="复制广告组"
                    type="button"
                    variant="ghost"
                    onClick={() => onDuplicateGroup(group.id)}
                  >
                    <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                ) : null}
              </div>

              <div className="border-t border-[var(--hairline)] bg-[var(--canvas)]/45 px-3 py-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    广告 · {group.ads.length}
                  </p>
                  {onAddAd ? (
                    <Button
                      className="h-7 gap-1 px-2 text-xs"
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onAddAd(group.id)}
                    >
                      <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                      新增
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-1">
                  {group.ads.map((ad, adIndex) => {
                    const isAdActive = activeGroupId === group.id && activeAdId === ad.id;
                    const adSummary = summarizeAdCard(ad)
                      .replace(" 标题", " 标题")
                      .replace(" · ", " / ");

                    return (
                      <div
                        key={ad.id}
                        className={cn(
                          "relative flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition",
                          isAdActive
                            ? "bg-[var(--surface-strong)] ring-1 ring-[var(--ink)]/12"
                            : "hover:bg-[var(--surface-strong)]/70",
                        )}
                      >
                        {isAdActive ? (
                          <span className="absolute inset-y-1.5 left-1 w-1 rounded-full bg-[var(--ink)]/70" />
                        ) : null}
                        <button
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          type="button"
                          onClick={() => onOpenAd?.(group.id, ad.id)}
                        >
                          <span className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ads-dot)]",
                            isAdActive ? "ml-1" : "",
                          )} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-xs font-medium text-[var(--ink)]">
                                {`${adIndex + 1}. ${ad.name}`}
                              </span>
                              <span className="truncate text-[11px] text-[var(--muted)]">
                                {adSummary}
                              </span>
                            </span>
                          </span>
                        </button>
                        {onDuplicateAd ? (
                          <Button
                            aria-label={`复制广告 ${ad.name}`}
                            className="h-6 w-6 shrink-0 px-0"
                            size="sm"
                            title="复制广告"
                            type="button"
                            variant="ghost"
                            onClick={() => onDuplicateAd(group.id, ad.id)}
                          >
                            <Copy aria-hidden className="h-3 w-3" strokeWidth={1.75} />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
