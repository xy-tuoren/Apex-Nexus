"use client";

import { ChevronRight, Copy, Eye, LayoutGrid, List, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type OverviewItemProps = {
  campaign: CampaignOverviewMeta;
  canRemove: boolean;
  canDuplicate?: boolean;
  onEdit: () => void;
  onEditGroup?: (groupId: string) => void;
  onEditAd?: (groupId: string, adId: string) => void;
  onPreview: () => void;
  onSync?: () => void;
  onDuplicate?: () => void;
  onRemove: () => void;
};

function biddingValueText(bidding: string) {
  const value = bidding.match(/(?:目标\s+(?:CPA|CPC)\s+)(.+)$/)?.[1];
  return value ?? bidding;
}

export function CampaignViewToggle({
  mode,
  onChange,
}: {
  mode: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}) {
  return (
    <Tabs
      aria-label="视图切换"
      className="w-fit"
      value={mode}
      onValueChange={(v) => onChange(v as "grid" | "list")}
    >
      <TabsList className="h-auto rounded-lg bg-[var(--surface-card)] p-0.5">
        <TabsTrigger className="gap-1.5 rounded-md px-2.5 py-1.5 text-xs" value="grid">
          <LayoutGrid aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          组件
        </TabsTrigger>
        <TabsTrigger className="gap-1.5 rounded-md px-2.5 py-1.5 text-xs" value="list">
          <List aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          列表
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function CampaignOverviewCard({
  campaign,
  canRemove,
  canDuplicate = true,
  onEdit,
  onEditGroup,
  onEditAd,
  onPreview,
  onSync,
  onDuplicate,
  onRemove,
}: OverviewItemProps) {
  const indexLabel = String(campaign.index).padStart(2, "0");

  return (
    <article className="ads-campaign-card group flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--hairline)] bg-[var(--surface-card)] transition duration-300 hover:-translate-y-1">
      <div className="flex min-h-0 flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="ads-slot-index">
            {indexLabel}
          </span>
          {campaign.typeBadge ? (
            <Badge className="normal-case tracking-normal">{campaign.typeBadge}</Badge>
          ) : null}
        </div>
        <p className="mt-2.5 line-clamp-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {campaign.name}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
          {campaign.objective} · {campaign.bidding} · 预算 {campaign.budget}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Badge className="normal-case text-[10px] tracking-normal">{campaign.adGroupCount} 组 · {campaign.adCount} 广告</Badge>
          <Badge className="max-w-full truncate normal-case text-[10px] tracking-normal text-white" title={campaign.accountName || campaign.accountId}>
            {campaign.accountName || campaign.accountId || "未选择账号"}
          </Badge>
        </div>
        <div className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              AdGroup / Ad List
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              {campaign.adGroupCount} 组 · {campaign.adCount} 条
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-2 py-2 pb-4">
            {campaign.groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-transparent px-2 py-2 transition hover:border-[var(--hairline)] hover:bg-[var(--surface-strong)]">
                <button
                  className="flex w-full items-start justify-between gap-2 text-left"
                  type="button"
                  onClick={() => onEditGroup?.(group.id)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-[var(--ink)]">{group.name}</span>
                    <span className="mt-0.5 block line-clamp-1 text-[10px] leading-relaxed text-[var(--muted)]">{group.summary}</span>
                  </span>
                  <ChevronRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={1.75} />
                </button>
                <ul className="mt-1.5 space-y-1">
                  {group.ads.map((ad) => (
                    <li key={ad.id}>
                      <button
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-[var(--body)] transition hover:bg-[var(--surface-card)] hover:text-[var(--ink)]"
                        type="button"
                        onClick={() => onEditAd?.(group.id, ad.id)}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ads-dot)]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{ad.name}</span>
                          <span className="mt-0.5 block truncate text-[var(--muted)]">{ad.summary}</span>
                        </span>
                        <ChevronRight aria-hidden className="h-3 w-3 shrink-0 text-[var(--muted)]" strokeWidth={1.75} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Button className="h-8 gap-1 px-2.5 text-xs" size="sm" type="button" onClick={onEdit}>
            <Settings2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            设置 Campaign
          </Button>
          <Button className="h-8 gap-1 px-2.5 text-xs" size="sm" type="button" onClick={onPreview}>
            <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            预览
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="同步广告系列配置"
            className="h-8 w-8 px-0"
            size="sm"
            title="同步广告系列配置"
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onSync?.();
            }}
          >
            <RefreshCw aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Button>
          <Button
            aria-label="复制广告系列"
            className="h-8 w-8 px-0"
            disabled={!canDuplicate}
            size="sm"
            title="复制广告系列"
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate?.();
            }}
          >
            <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
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
      </div>
    </article>
  );
}

export function CampaignOverviewListRow({
  campaign,
  canRemove,
  canDuplicate = true,
  onEdit,
  onPreview,
  onSync,
  onDuplicate,
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
        aria-label="同步广告系列配置"
        className="h-8 w-8 shrink-0 px-0"
        size="sm"
        title="同步广告系列配置"
        type="button"
        variant="ghost"
        onClick={onSync}
      >
        <RefreshCw aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Button>
      <Button
        aria-label="复制广告系列"
        className="h-8 w-8 shrink-0 px-0"
        disabled={!canDuplicate}
        size="sm"
        title="复制广告系列"
        type="button"
        variant="ghost"
        onClick={onDuplicate}
      >
        <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
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

export function CampaignOverviewTable({
  campaigns,
  canRemove,
  onEdit,
  onPreview,
  onSync,
  onDuplicate,
  onRemove,
}: {
  campaigns: CampaignOverviewMeta[];
  canRemove: (campaignId: string) => boolean;
  onEdit: (campaignId: string) => void;
  onPreview: (campaignId: string) => void;
  onSync: (campaignId: string) => void;
  onDuplicate: (campaignId: string) => void;
  onRemove: (campaignId: string) => void;
}) {
  const fixedColumnWidths = [64, 160, 72, 72, 64, 100, 188] as const;
  const minTableWidth = fixedColumnWidths.reduce((total, width) => total + width, 0) + 280;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] animate-fade-up">
      <Table
        className="table-fixed border-collapse [&_td]:border-[var(--hairline)] [&_th]:border-[var(--hairline)]"
        style={{ minWidth: minTableWidth, width: "100%" }}
      >
        <colgroup>
          <col style={{ width: fixedColumnWidths[0] }} />
          <col />
          <col style={{ width: fixedColumnWidths[1] }} />
          <col style={{ width: fixedColumnWidths[2] }} />
          <col style={{ width: fixedColumnWidths[3] }} />
          <col style={{ width: fixedColumnWidths[4] }} />
          <col style={{ width: fixedColumnWidths[5] }} />
          <col style={{ width: fixedColumnWidths[6] }} />
        </colgroup>
        <TableHeader>
          <TableRow className="border-b border-[var(--hairline)] bg-[var(--canvas-soft)] hover:bg-[var(--canvas-soft)]">
            <TableHead className="border-r border-[var(--hairline)] px-2 py-2 text-center text-xs font-semibold text-[var(--muted)]">序号</TableHead>
            <TableHead className="border-r border-[var(--hairline)] px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">Campaign</TableHead>
            <TableHead className="border-r border-[var(--hairline)] px-2 py-2 text-left text-xs font-semibold text-[var(--muted)]">投放账号</TableHead>
            <TableHead className="border-r border-[var(--hairline)] px-2 py-2 text-center text-xs font-semibold text-[var(--muted)]">目标</TableHead>
            <TableHead className="border-r border-[var(--hairline)] px-2 py-2 text-center text-xs font-semibold text-[var(--muted)]">出价</TableHead>
            <TableHead className="border-r border-[var(--hairline)] px-2 py-2 text-center text-xs font-semibold text-[var(--muted)]">预算</TableHead>
            <TableHead className="border-r border-[var(--hairline)] px-2 py-2 text-center text-xs font-semibold text-[var(--muted)]">结构</TableHead>
            <TableHead className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted)]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const indexLabel = String(campaign.index).padStart(2, "0");
            return (
              <TableRow key={campaign.id} className="border-b border-[var(--hairline)] transition-colors hover:bg-muted">
                <TableCell className="border-r border-[var(--hairline)] px-2 py-2 text-center">
                  <span className="module-index mx-auto">{indexLabel}</span>
                </TableCell>
                <TableCell className="border-r border-[var(--hairline)] px-3 py-2">
                  <button className="block w-full min-w-0 text-left" type="button" onClick={() => onPreview(campaign.id)}>
                    <span className="block truncate text-sm font-semibold leading-tight text-[var(--ink)]" title={campaign.name}>
                      {campaign.name}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-xs leading-snug text-[var(--muted)]"
                      title={campaign.highlights.join(" · ")}
                    >
                      {campaign.highlights.join(" · ") || "未配置投放信息"}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="min-w-0 border-r border-[var(--hairline)] px-2 py-2">
                  <span className="block truncate text-sm leading-tight text-[var(--ink)]" title={campaign.accountName ?? campaign.accountId}>
                    {campaign.accountName ?? (campaign.accountId || "未选择账号")}
                  </span>
                  {campaign.accountId ? (
                    <span className="mt-0.5 block truncate text-xs leading-tight text-[var(--muted)]" title={campaign.accountId}>
                      {campaign.accountId}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="border-r border-[var(--hairline)] px-2 py-2 text-center text-sm text-[var(--body)]">
                  {campaign.objective}
                </TableCell>
                <TableCell className="border-r border-[var(--hairline)] px-2 py-2 text-center text-sm text-[var(--body)]">
                  {biddingValueText(campaign.bidding)}
                </TableCell>
                <TableCell className="border-r border-[var(--hairline)] px-2 py-2 text-center text-sm tabular-nums text-[var(--body)]">
                  {campaign.budget}
                </TableCell>
                <TableCell className="border-r border-[var(--hairline)] px-2 py-2 text-center text-sm text-[var(--body)]">
                  {campaign.adGroupCount} 组 / {campaign.adCount} 广告
                </TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      aria-label="设置 Campaign"
                      className="h-7 w-7 px-0"
                      size="sm"
                      title="设置 Campaign"
                      type="button"
                      onClick={() => onEdit(campaign.id)}
                    >
                      <Settings2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    <Button
                      aria-label="预览 Campaign"
                      className="h-7 w-7 px-0"
                      size="sm"
                      title="预览"
                      type="button"
                      variant="outline"
                      onClick={() => onPreview(campaign.id)}
                    >
                      <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    <Button
                      aria-label="同步广告系列配置"
                      className="h-7 w-7 px-0"
                      size="sm"
                      title="同步广告系列配置"
                      type="button"
                      variant="ghost"
                      onClick={() => onSync(campaign.id)}
                    >
                      <RefreshCw aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    <Button
                      aria-label="复制广告系列"
                      className="h-7 w-7 px-0"
                      size="sm"
                      title="复制广告系列"
                      type="button"
                      variant="ghost"
                      onClick={() => onDuplicate(campaign.id)}
                    >
                      <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    <Button
                      aria-label="删除广告系列"
                      className="h-7 w-7 px-0"
                      disabled={!canRemove(campaign.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onRemove(campaign.id)}
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function CampaignOverviewAddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="ads-empty-campaign flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-card)] text-sm font-medium text-[var(--body)] transition duration-300 hover:-translate-y-1 hover:text-[var(--ink)]"
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
