"use client";

import { AlertCircle, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { AdGroupErrors, AdErrors } from "@/components/ads/campaign-hierarchy/form-utils";

type EditorSidebarProps = {
  campaign: CampaignForm;
  activeGroupId?: string | null;
  activeAdId?: string | null;
  geoTargets?: GeoTargetOption[];
  languageTargets?: LanguageTargetOption[];
  groupErrors?: Record<string, AdGroupErrors>;
  adErrors?: Record<string, AdErrors>;
  onOpenCampaign?: () => void;
  onOpenGroup?: (groupId: string) => void;
  onOpenAd?: (groupId: string, adId: string) => void;
  onAddGroup?: () => void;
  onAddAd?: (groupId: string) => void;
  onDuplicateGroup?: (groupId: string) => void;
  onDuplicateAd?: (groupId: string, adId: string) => void;
  onRemoveGroup?: (groupId: string) => void;
  onRemoveAd?: (groupId: string, adId: string) => void;
};

export function EditorSidebar({
  campaign,
  activeGroupId,
  activeAdId,
  groupErrors = {},
  adErrors = {},
  onOpenCampaign,
  onOpenGroup,
  onOpenAd,
  onAddGroup,
  onAddAd,
  onDuplicateGroup,
  onDuplicateAd,
  onRemoveGroup,
  onRemoveAd,
}: EditorSidebarProps) {
  return (
    <aside className="rounded-[1.75rem] border border-[var(--hairline)] bg-[var(--canvas-soft)] p-2.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--hairline)] px-1 pb-2.5">
        <div>
          <p className="text-caption-uppercase text-[var(--muted)]">导航</p>
          <p className="mt-0.5 text-[13px] font-semibold text-[var(--ink)]">
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

      {onOpenCampaign ? (
        <div className="mt-2">
          <div
            className={cn(
              "overflow-hidden rounded-2xl border transition",
              !activeGroupId && !activeAdId
                ? "border-[var(--ink)]/40 bg-[var(--surface-card)] ring-1 ring-[var(--ink)]/12"
                : "border-[var(--hairline)] bg-[var(--surface-card)]",
            )}
          >
            <button
              type="button"
              onClick={onOpenCampaign}
              className={cn(
                "relative flex w-full items-center gap-2 px-3 py-1.5 text-left transition",
                !activeGroupId && !activeAdId
                  ? "bg-[var(--surface-strong)]"
                  : "hover:bg-[var(--surface-strong)]",
              )}
            >
              {(!activeGroupId && !activeAdId) ? (
                <span className="absolute inset-y-1.5 left-1 w-1 rounded-full bg-[var(--ink)]/70" />
              ) : null}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)] text-[10px] font-semibold text-[var(--muted)]">
                C
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--ink)]">
                {campaign.campaignName || "广告系列"}
              </span>
              <ChevronRight className="h-3 w-3 shrink-0 text-[var(--muted-soft)]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-1.5 space-y-1.5">
        {campaign.adGroups.map((group, groupIndex) => {
          const isGroupActive = activeGroupId === group.id && !activeAdId;
          const hasActiveAd = activeGroupId === group.id && Boolean(activeAdId);
          const ge = groupErrors[group.id];
          const hasGroupError = ge && Object.values(ge).some(Boolean);

          return (
            <section
              key={group.id}
              className={cn(
                "overflow-hidden rounded-2xl border transition",
                hasGroupError
                  ? "border-[var(--semantic-error)]/50 bg-[var(--surface-card)]"
                  : isGroupActive || hasActiveAd
                    ? "border-[var(--ink)]/40 bg-[var(--surface-card)] ring-1 ring-[var(--ink)]/12"
                    : "border-[var(--hairline)] bg-[var(--surface-card)]",
              )}
            >
              <div
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 transition",
                  isGroupActive
                    ? "bg-[var(--surface-strong)]"
                    : onOpenGroup
                      ? "hover:bg-[var(--surface-strong)]"
                      : "",
                )}
              >
                {(isGroupActive || hasActiveAd) ? (
                  <span className="absolute inset-y-1.5 left-1 w-1 rounded-full bg-[var(--ink)]/70" />
                ) : null}
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  type="button"
                  onClick={() => onOpenGroup?.(group.id)}
                >
                  <span className={cn(
                    "module-index flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                    hasGroupError
                      ? "border-[var(--semantic-error)]/50 bg-[var(--semantic-error)]/8 text-[var(--semantic-error)]"
                      : "border-[var(--hairline)] bg-[var(--surface-strong)] text-[var(--ink)]",
                  )}>
                    {hasGroupError ? (
                      <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                      String(groupIndex + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "truncate text-sm font-semibold",
                        hasGroupError ? "text-[var(--semantic-error)]" : "text-[var(--ink)]",
                      )}>
                        {group.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">
                        {group.ads.length} 广告
                      </span>
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  {onDuplicateGroup ? (
                    <Button
                      aria-label={`复制广告组 ${group.name}`}
                      className="h-7 w-7 px-0"
                      size="sm"
                      title="复制广告组"
                      type="button"
                      variant="ghost"
                      onClick={() => onDuplicateGroup(group.id)}
                    >
                      <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                  ) : null}
                  {onRemoveGroup && campaign.adGroups.length > 1 ? (
                    <Button
                      aria-label={`删除广告组 ${group.name}`}
                      className="h-7 w-7 px-0 text-[var(--semantic-error)] hover:text-[var(--semantic-error)]"
                      size="sm"
                      title="删除广告组"
                      type="button"
                      variant="ghost"
                      onClick={() => onRemoveGroup(group.id)}
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-[var(--hairline)] bg-[var(--canvas)]/45 px-3 py-1.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    广告 · {group.ads.length}
                  </p>
                  {onAddAd ? (
                    <Button
                      className="h-6 gap-1 px-1.5 text-[10px]"
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onAddAd(group.id)}
                    >
                      <Plus aria-hidden className="h-3 w-3" strokeWidth={1.75} />
                      新增
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-0.5">
                  {group.ads.map((ad) => {
                    const isAdActive = activeGroupId === group.id && activeAdId === ad.id;
                    const ae = adErrors[`${group.id}:${ad.id}`];
                    const hasAdError = ae && Object.values(ae).some(Boolean);

                    return (
                      <div
                        key={ad.id}
                        className={cn(
                          "relative flex w-full items-center gap-1 rounded-xl text-left transition",
                          hasAdError
                            ? "bg-[var(--semantic-error)]/6 ring-1 ring-[var(--semantic-error)]/25"
                            : isAdActive
                              ? "bg-[var(--surface-strong)] ring-1 ring-[var(--ink)]/12"
                              : "hover:bg-[var(--surface-strong)]/70",
                        )}
                      >
                        {isAdActive ? (
                          <span className="absolute inset-y-1 left-1 w-1 rounded-full bg-[var(--ink)]/70" />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onOpenAd?.(group.id, ad.id)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pl-2.5 text-left"
                        >
                          <span className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            hasAdError ? "bg-[var(--semantic-error)]" : "bg-[var(--ads-dot)]",
                            isAdActive ? "ml-1" : "",
                          )} />
                          <span className={cn(
                            "min-w-0 flex-1 truncate text-xs font-medium",
                            hasAdError ? "text-[var(--semantic-error)]" : "text-[var(--ink)]",
                          )}>
                            {ad.name}
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5 pr-2">
                          {onDuplicateAd ? (
                            <Button
                              aria-label={`复制广告 ${ad.name}`}
                              className="h-6 w-6 px-0"
                              size="sm"
                              title="复制广告"
                              type="button"
                              variant="ghost"
                              onClick={() => onDuplicateAd(group.id, ad.id)}
                            >
                              <Copy aria-hidden className="h-3 w-3" strokeWidth={1.75} />
                            </Button>
                          ) : null}
                          {onRemoveAd && group.ads.length > 1 ? (
                            <Button
                              aria-label={`删除广告 ${ad.name}`}
                              className="h-6 w-6 px-0 text-[var(--semantic-error)] hover:text-[var(--semantic-error)]"
                              size="sm"
                              title="删除广告"
                              type="button"
                              variant="ghost"
                              onClick={() => onRemoveAd(group.id, ad.id)}
                            >
                              <Trash2 aria-hidden className="h-3 w-3" strokeWidth={1.75} />
                            </Button>
                          ) : null}
                        </div>
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
