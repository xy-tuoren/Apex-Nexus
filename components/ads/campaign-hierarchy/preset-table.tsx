"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEVICE_TAG_TONES,
  PRESET_TABLE_HEAD_CLASS,
  SCHEDULE_DAY_TAG_TONES,
  type PresetDeviceTag,
  type PresetScheduleTag,
  type PresetTableRow,
} from "@/components/ads/campaign-hierarchy/preset-utils";

const TEXT_LIST_CELL_CLASS =
  "align-middle border-r border-[var(--hairline)] px-3 py-2.5 text-left last:border-r-0";
import type { CampaignPreset } from "@/lib/types";

const PRESET_TABLE_CELL_CLASS =
  "align-middle whitespace-normal border-r border-[var(--hairline)] px-3 py-2.5 text-center last:border-r-0";
const PRESET_TABLE_HEAD_DIVIDER_CLASS = `${PRESET_TABLE_HEAD_CLASS} border-r border-[var(--hairline)] last:border-r-0`;
const CLAMPED_TEXT_CLASS =
  "block max-w-full overflow-hidden whitespace-normal break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [overflow-wrap:anywhere]";

const BADGE_TONE_CLASS: Record<string, string> = {
  neutral: "border-[var(--hairline)] bg-[var(--surface-strong)] text-[var(--body)]",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
};

function ToneBadge({
  children,
  className,
  title,
  tone,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  tone: string;
}) {
  return (
    <Badge
      className={`${BADGE_TONE_CLASS[tone] ?? BADGE_TONE_CLASS.neutral} max-w-full ${className ?? ""}`}
      title={title}
      variant="outline"
    >
      <span className={CLAMPED_TEXT_CLASS}>{children}</span>
    </Badge>
  );
}

const PRESET_TABLE_COLUMNS = [
  { key: "select", width: 44, label: "" },
  { key: "name", width: 80, label: "名称" },
  { key: "description", width: 120, label: "描述" },
  { key: "site", width: 132, label: "站点" },
  { key: "objective", width: 80, label: "目标" },
  { key: "bidding", width: 56, label: "出价" },
  { key: "budget", width: 56, label: "预算" },
  { key: "campaignNameSuffix", width: 80, label: "后缀" },
  { key: "schedule", width: 268, label: "投放时间" },
  { key: "device", width: 120, label: "设备" },
  { key: "location", width: 112, label: "位置" },
  { key: "shortHeadlines", width: 168, label: "短标题" },
  { key: "longHeadlines", width: 168, label: "长标题" },
  { key: "descriptions", width: 168, label: "广告描述" },
  { key: "updatedAt", width: 100, label: "更新" },
  { key: "actions", width: 172, label: "操作" },
] as const;
type PresetTableColumn = (typeof PRESET_TABLE_COLUMNS)[number];

function PresetCellContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-center gap-1 text-center">
      {children}
    </div>
  );
}

function ClampedText({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span className={`${CLAMPED_TEXT_CLASS} ${className ?? ""}`} title={title}>
      {children}
    </span>
  );
}

function renderPresetTextList(items: string[]) {
  if (items.length === 0) {
    return <span className="text-xs text-[var(--muted)]">-</span>;
  }

  return (
    <div className="flex w-full flex-col items-start gap-0.5 text-left">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={CLAMPED_TEXT_CLASS} title={item}>
          {index + 1}. {item}
        </span>
      ))}
    </div>
  );
}

function renderPresetDeviceTags(tags: PresetDeviceTag[]) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {tags.map((tag) => (
        <ToneBadge
          key={tag.key}
          tone={DEVICE_TAG_TONES[tag.key as keyof typeof DEVICE_TAG_TONES] ?? "neutral"}
        >
          {tag.label}
        </ToneBadge>
      ))}
    </div>
  );
}

function renderPresetScheduleTags(tags: PresetScheduleTag[]) {
  return (
    <div className="grid w-full grid-cols-2 items-center justify-items-center gap-1.5">
      {tags.map((tag) => (
        <ToneBadge
          key={tag.key}
          title={tag.label}
          tone={SCHEDULE_DAY_TAG_TONES[tag.key as keyof typeof SCHEDULE_DAY_TAG_TONES] ?? "neutral"}
          className="h-auto w-full justify-center whitespace-normal py-1 text-center text-[11px] leading-snug"
        >
          {tag.label}
        </ToneBadge>
      ))}
    </div>
  );
}

type PresetTableProps = {
  rows: PresetTableRow[];
  presets: CampaignPreset[];
  deletingPresetIds?: Set<string>;
  selectedPresetIds?: Set<string>;
  onEdit?: (preset: CampaignPreset) => void;
  onDelete?: (presetId: string) => void;
  onRowClick?: (preset: CampaignPreset) => void;
  onToggleAllSelected?: (checked: boolean) => void;
  onTogglePresetSelected?: (presetId: string, checked: boolean) => void;
};

export function PresetTable({
  rows,
  presets,
  deletingPresetIds = new Set<string>(),
  selectedPresetIds = new Set<string>(),
  onEdit,
  onDelete,
  onRowClick,
  onToggleAllSelected,
  onTogglePresetSelected,
}: PresetTableProps) {
  const hasActions = Boolean(onEdit || onDelete);
  const hasSelection = Boolean(onTogglePresetSelected);
  const allSelected = rows.length > 0 && rows.every((row) => selectedPresetIds.has(row.id));
  const baseColumns: PresetTableColumn[] = [...PRESET_TABLE_COLUMNS];
  const displayColumns = hasActions
    ? baseColumns
    : baseColumns.filter((c) => c.key !== "actions");
  const visibleColumns = hasSelection
    ? displayColumns
    : displayColumns.filter((c) => c.key !== "select");
  const minWidth = visibleColumns.reduce<number>((total, column) => total + column.width, 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)]">
      <Table
        className="table-fixed border-collapse [&_td]:border-[var(--hairline)] [&_th]:border-[var(--hairline)]"
        style={{ minWidth, width: minWidth }}
      >
        <colgroup>
          {visibleColumns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="border-b border-[var(--hairline)] bg-[var(--canvas-soft)] hover:bg-[var(--canvas-soft)]">
            {visibleColumns.map((column) => (
              <TableHead key={column.key} className={PRESET_TABLE_HEAD_DIVIDER_CLASS}>
                {column.key === "select" ? (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      aria-label="选择当前页预设"
                      checked={allSelected}
                      onCheckedChange={(checked) => onToggleAllSelected?.(checked === true)}
                    />
                  </div>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const preset = presets.find((item) => item.id === row.id);
            const isDeleting = deletingPresetIds.has(row.id);
            const rowClass = onRowClick
              ? "border-b border-[var(--hairline)] transition-colors hover:bg-muted cursor-pointer"
              : selectedPresetIds.has(row.id)
                ? "border-b border-[var(--hairline)] bg-[var(--canvas-soft)] transition-colors hover:bg-muted"
                : "border-b border-[var(--hairline)] transition-colors hover:bg-muted";
            return (
              <TableRow
                key={row.id}
                className={rowClass}
                onClick={preset && onRowClick ? () => onRowClick(preset) : undefined}
              >
                {hasSelection ? (
                  <TableCell className={PRESET_TABLE_CELL_CLASS}>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        aria-label={`选择预设 ${row.name}`}
                        checked={selectedPresetIds.has(row.id)}
                        onClick={(event) => event.stopPropagation()}
                        onCheckedChange={(checked) => onTogglePresetSelected?.(row.id, checked === true)}
                      />
                    </div>
                  </TableCell>
                ) : null}
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-sm font-semibold text-[var(--ink)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.name}>{row.name}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-xs text-[var(--muted)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.description || undefined}>{row.description || "-"}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-xs text-[var(--muted)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.siteLabel}>{row.siteLabel}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={PRESET_TABLE_CELL_CLASS}>
                  <PresetCellContent>
                    <ToneBadge tone="neutral">{row.campaignObjectiveLabel}</ToneBadge>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-sm tabular-nums text-[var(--ink)]`}>
                  <PresetCellContent>
                    <ClampedText>{row.bidding}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-sm tabular-nums text-[var(--ink)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.budget}>{row.budget}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-xs text-[var(--muted)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.campaignNameSuffix || undefined}>{row.campaignNameSuffix || "-"}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={PRESET_TABLE_CELL_CLASS}>
                  <PresetCellContent>{renderPresetScheduleTags(row.scheduleTags)}</PresetCellContent>
                </TableCell>
                <TableCell className={PRESET_TABLE_CELL_CLASS}>
                  <PresetCellContent>{renderPresetDeviceTags(row.deviceTags)}</PresetCellContent>
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} whitespace-normal text-xs leading-relaxed text-[var(--muted)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.locationLabel}>{row.locationLabel}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                <TableCell className={TEXT_LIST_CELL_CLASS}>
                  {renderPresetTextList(row.shortHeadlines)}
                </TableCell>
                <TableCell className={TEXT_LIST_CELL_CLASS}>
                  {renderPresetTextList(row.longHeadlines)}
                </TableCell>
                <TableCell className={TEXT_LIST_CELL_CLASS}>
                  {renderPresetTextList(row.adDescriptions)}
                </TableCell>
                <TableCell className={`${PRESET_TABLE_CELL_CLASS} text-xs tabular-nums text-[var(--muted)]`}>
                  <PresetCellContent>
                    <ClampedText title={row.updatedAt}>{row.updatedAt}</ClampedText>
                  </PresetCellContent>
                </TableCell>
                {hasActions ? (
                  <TableCell className={`${PRESET_TABLE_CELL_CLASS} whitespace-nowrap`}>
                    {preset ? (
                      <PresetCellContent>
                      <div className="inline-flex flex-nowrap items-center justify-center gap-2">
                        {onEdit ? (
                          <Button
                            aria-label={`编辑预设 ${preset.name}`}
                            className="h-7 gap-1.5 rounded-lg px-2.5 whitespace-nowrap"
                            disabled={isDeleting}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(preset);
                            }}
                          >
                            <Pencil aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            编辑
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            aria-label={`删除预设 ${preset.name}`}
                            className="h-7 gap-1.5 rounded-lg px-2.5 whitespace-nowrap text-[var(--semantic-error)] hover:border-[var(--semantic-error)]/30 hover:bg-[var(--semantic-error)]/8 hover:text-[var(--semantic-error)]"
                            disabled={isDeleting}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              void onDelete(preset.id);
                            }}
                          >
                            {isDeleting ? (
                              <Spinner aria-hidden className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <Trash2 aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            )}
                            {isDeleting ? "删除中" : "删除"}
                          </Button>
                        ) : null}
                      </div>
                      </PresetCellContent>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
