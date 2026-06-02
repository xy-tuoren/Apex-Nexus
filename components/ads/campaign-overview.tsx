"use client";

import { ChevronRight, Eye, LayoutGrid, List, Plus, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CampaignOverviewAd = {
  id: string;
  name: string;
  summary: string;
};

export type CampaignOverviewGroup = {
  id: string;
  name: string;
  summary: string;
  ads: CampaignOverviewAd[];
};

export type CampaignOverviewMeta = {
  id: string;
  index: number;
  name: string;
  objective: string;
  bidding: string;
  budget: string;
  adGroupCount: number;
  adCount: number;
  accountId: string;
  accountName?: string;
  typeBadge?: string;
  highlights: string[];
  groups: CampaignOverviewGroup[];
};

function OverviewHighlights({ highlights }: { highlights: string[] }) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1.5 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-strong)] px-3.5 py-3 text-[11px] leading-relaxed text-[var(--body)]">
      {highlights.map((line, index) => (
        <li key={`${line}-${index}`} className="line-clamp-2 border-b border-[var(--hairline)]/70 pb-1.5 last:border-b-0 last:pb-0">
          {line}
        </li>
      ))}
    </ul>
  );
}

type OverviewItemProps = {
  campaign: CampaignOverviewMeta;
  canRemove: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onRemove: () => void;
};

export function CampaignViewToggle({
  mode,
  onChange,
}: {
  mode: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-0.5"
      role="group"
      aria-label="视图切换"
    >
      <button
        aria-pressed={mode === "grid"}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
          mode === "grid"
            ? "bg-[var(--surface-strong)] text-[var(--ink)]"
            : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
        type="button"
        onClick={() => onChange("grid")}
      >
        <LayoutGrid aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        组件
      </button>
      <button
        aria-pressed={mode === "list"}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
          mode === "list"
            ? "bg-[var(--surface-strong)] text-[var(--ink)]"
            : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
        type="button"
        onClick={() => onChange("list")}
      >
        <List aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        列表
      </button>
    </div>
  );
}

export function CampaignOverviewCard({
  campaign,
  canRemove,
  onEdit,
  onPreview,
  onRemove,
}: OverviewItemProps) {
  const indexLabel = String(campaign.index).padStart(2, "0");

  return (
    <article className="ads-campaign-card group flex min-h-[34rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--hairline)] bg-[var(--surface-card)] transition duration-300 hover:-translate-y-1">
      <button
        className="flex min-h-0 flex-1 flex-col p-5 text-left"
        type="button"
        onClick={onPreview}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="ads-slot-index">
            {indexLabel}
          </span>
          {campaign.typeBadge ? (
            <Badge className="normal-case tracking-normal">{campaign.typeBadge}</Badge>
          ) : null}
        </div>
        <p className="mt-4 line-clamp-2 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {campaign.name}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          {campaign.objective} · {campaign.bidding} · 预算 {campaign.budget}
        </p>
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
            内容概览
          </p>
          <OverviewHighlights highlights={campaign.highlights} />
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              AdGroup / Ad
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              {campaign.adGroupCount} 组 · {campaign.adCount} 条
            </span>
          </div>
          <div className="max-h-44 overflow-auto p-2">
            {campaign.groups.map((group) => (
              <div key={group.id} className="rounded-xl px-2 py-2 hover:bg-[var(--surface-strong)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-[var(--ink)]">{group.name}</p>
                  <span className="shrink-0 text-[10px] text-[var(--muted)]">{group.summary}</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {group.ads.slice(0, 3).map((ad) => (
                    <li key={ad.id} className="flex items-center gap-2 text-[11px] text-[var(--body)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ads-dot)]" />
                      <span className="truncate">{ad.name}</span>
                      <span className="shrink-0 text-[var(--muted)]">{ad.summary}</span>
                    </li>
                  ))}
                  {group.ads.length > 3 ? (
                    <li className="text-[11px] text-[var(--muted)]">+ {group.ads.length - 3} 条广告</li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--hairline)] pt-4 text-xs">
          <div className="rounded-2xl bg-[var(--surface-strong)] px-3 py-2.5">
            <dt className="text-[var(--muted)]">结构</dt>
            <dd className="mt-0.5 font-medium text-[var(--ink)]">
              {campaign.adGroupCount} 组 · {campaign.adCount} 广告
            </dd>
          </div>
          <div className="rounded-2xl bg-[var(--surface-strong)] px-3 py-2.5">
            <dt className="text-[var(--muted)]">账号</dt>
            <dd className="mt-0.5 truncate font-medium text-[var(--ink)]" title={campaign.accountName}>
              {campaign.accountId || "未选择"}
            </dd>
          </div>
        </dl>
      </button>
      <div className="flex items-center justify-between gap-2 border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-3">
        <Button className="h-8 gap-1 px-2.5 text-xs" size="sm" type="button" onClick={onEdit}>
          <Settings2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          设置 Campaign
        </Button>
        <Button className="h-8 gap-1 px-2.5 text-xs" size="sm" type="button" variant="outline" onClick={onPreview}>
          <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          预览
        </Button>
        <Button
          aria-label="删除广告系列"
          className="h-8 w-8 px-0"
          disabled={!canRemove}
          size="sm"
          type="button"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Button>
      </div>
    </article>
  );
}

export function CampaignOverviewListRow({
  campaign,
  canRemove,
  onEdit,
  onPreview,
  onRemove,
}: OverviewItemProps) {
  const indexLabel = String(campaign.index).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3 last:border-b-0">
      <span className="module-index shrink-0">{indexLabel}</span>
      <button
        className="min-w-0 flex-1 text-left"
        type="button"
        onClick={onPreview}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
          {campaign.typeBadge ? (
            <Badge className="normal-case tracking-normal">{campaign.typeBadge}</Badge>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">
          {campaign.highlights.slice(0, 3).join(" · ") ||
            `${campaign.objective} · ${campaign.bidding} · 预算 ${campaign.budget}`}
        </p>
      </button>
      <Button className="h-8 shrink-0 gap-1 px-2.5 text-xs" size="sm" type="button" onClick={onEdit}>
        设置
          <ChevronRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Button>
      <Button
        aria-label="删除广告系列"
        className="h-8 w-8 shrink-0 px-0"
        disabled={!canRemove}
        size="sm"
        type="button"
        variant="ghost"
        onClick={onRemove}
      >
        <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Button>
    </div>
  );
}

export function CampaignOverviewAddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="ads-empty-campaign flex min-h-[34rem] flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-card)] text-sm font-medium text-[var(--body)] transition duration-300 hover:-translate-y-1 hover:text-[var(--ink)]"
      type="button"
      onClick={onClick}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--ads-accent-soft)]">
        <Plus aria-hidden className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.75} />
      </span>
      新增广告系列
    </button>
  );
}
