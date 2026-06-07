"use client";

import { useState, type MouseEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CampaignForm } from "@/components/ads/campaign-hierarchy/types";

export type CampaignSyncField =
  | "siteId"
  | "adAccountId"
  | "advertisingType"
  | "campaignName"
  | "campaignObjective"
  | "conversionGoal"
  | "biddingType"
  | "clickBiddingType"
  | "targetCpa"
  | "targetCpc"
  | "budgetDaily"
  | "os"
  | "devices"
  | "adSchedule"
  | "finalUrlSuffix"
  | "ipExclusions"
  | "campaignNameSuffix"
  | "adGroupName"
  | "locations"
  | "language"
  | "genders"
  | "ageRanges"
  | "adName"
  | "finalUrl"
  | "videoLinks"
  | "logos"
  | "shortHeadlines"
  | "longHeadlines"
  | "descriptions"
  | "businessName"
  | "callToAction";

export const DEFAULT_CAMPAIGN_SYNC_FIELDS: CampaignSyncField[] = ["finalUrl", "videoLinks"];

const SYNC_FIELD_GROUPS: {
  title: string;
  fields: { id: CampaignSyncField; label: string }[];
}[] = [
  {
    title: "Campaign 配置",
    fields: [
      { id: "siteId", label: "站点" },
      { id: "adAccountId", label: "投放账号" },
      { id: "campaignName", label: "Campaign 名称" },
      { id: "advertisingType", label: "广告类型" },
      { id: "campaignObjective", label: "目标" },
      { id: "conversionGoal", label: "转化目标" },
      { id: "biddingType", label: "转化出价策略" },
      { id: "clickBiddingType", label: "点击出价策略" },
      { id: "targetCpa", label: "目标 CPA" },
      { id: "targetCpc", label: "目标 CPC" },
      { id: "budgetDaily", label: "日预算" },
      { id: "os", label: "操作系统" },
      { id: "devices", label: "设备" },
      { id: "adSchedule", label: "投放时间" },
      { id: "finalUrlSuffix", label: "URL 后缀" },
      { id: "ipExclusions", label: "排除 IP" },
      { id: "campaignNameSuffix", label: "名称后缀" },
    ],
  },
  {
    title: "AdGroup 配置",
    fields: [
      { id: "adGroupName", label: "广告组名称" },
      { id: "locations", label: "地理位置" },
      { id: "language", label: "语言" },
      { id: "genders", label: "性别" },
      { id: "ageRanges", label: "年龄" },
    ],
  },
  {
    title: "Ad 配置 / 素材",
    fields: [
      { id: "adName", label: "广告名称" },
      { id: "finalUrl", label: "最终到达网址" },
      { id: "videoLinks", label: "视频素材" },
      { id: "logos", label: "徽标" },
      { id: "shortHeadlines", label: "短标题" },
      { id: "longHeadlines", label: "长标题" },
      { id: "descriptions", label: "内容描述" },
      { id: "businessName", label: "商家名称" },
      { id: "callToAction", label: "号召性用语" },
    ],
  },
];

type CampaignSyncDialogProps = {
  open: boolean;
  sourceCampaign: CampaignForm | null;
  targetCampaigns: CampaignForm[];
  selectedFields: Set<CampaignSyncField>;
  selectedTargetIds: Set<string>;
  onClose: () => void;
  onToggleField: (field: CampaignSyncField, checked: boolean) => void;
  onToggleTarget: (campaignId: string, checked: boolean) => void;
  onSetTargetIds: (campaignIds: Set<string>) => void;
  onSync: () => void;
};

export function CampaignSyncDialog({
  open,
  sourceCampaign,
  targetCampaigns,
  selectedFields,
  selectedTargetIds,
  onClose,
  onToggleField,
  onToggleTarget,
  onSetTargetIds,
  onSync,
}: CampaignSyncDialogProps) {
  const [lastTargetIndex, setLastTargetIndex] = useState<number | null>(null);
  const allTargetIds = targetCampaigns.map((campaign) => campaign.id);
  const allTargetsSelected =
    allTargetIds.length > 0 && allTargetIds.every((campaignId) => selectedTargetIds.has(campaignId));

  function toggleAllTargets() {
    onSetTargetIds(allTargetsSelected ? new Set() : new Set(allTargetIds));
    setLastTargetIndex(null);
  }

  function handleTargetClick(event: MouseEvent, campaignId: string, index: number) {
    event.preventDefault();
    const next = new Set(selectedTargetIds);
    const nextChecked = !selectedTargetIds.has(campaignId);

    if (event.shiftKey && lastTargetIndex !== null) {
      const start = Math.min(lastTargetIndex, index);
      const end = Math.max(lastTargetIndex, index);
      targetCampaigns.slice(start, end + 1).forEach((campaign) => {
        if (nextChecked) {
          next.add(campaign.id);
        } else {
          next.delete(campaign.id);
        }
      });
      onSetTargetIds(next);
      return;
    }

    onToggleTarget(campaignId, nextChecked);
    setLastTargetIndex(index);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[86vh] overflow-hidden p-0 sm:max-w-[880px]">
        <DialogHeader className="border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                同步 Campaign 配置
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-xs text-[var(--muted)]">
                源 Campaign：{sourceCampaign?.campaignName ?? "未选择"}
              </DialogDescription>
            </div>
            <Badge className="normal-case tracking-normal" variant="outline">
              {selectedFields.size} 项配置 · {selectedTargetIds.size} 个目标
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 gap-0 overflow-hidden md:grid-cols-[1fr_1.35fr]">
          <section className="min-h-0 border-b border-[var(--hairline)] p-4 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">选择目标 Campaign</h3>
              <Button
                className="h-7 px-2 text-xs"
                disabled={targetCampaigns.length === 0}
                type="button"
                variant="outline"
                onClick={toggleAllTargets}
              >
                {allTargetsSelected ? "清空" : "全选"}
              </Button>
            </div>
            <div className="mt-2 max-h-[46vh] space-y-1 overflow-auto pr-1">
              {targetCampaigns.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-5 text-center text-sm text-[var(--muted)]">
                  暂无其他 Campaign 可同步。
                </p>
              ) : (
                targetCampaigns.map((campaign, index) => (
                  <label
                    key={campaign.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] px-2.5 py-1.5 transition hover:bg-[var(--canvas-soft)]"
                    onClick={(event) => handleTargetClick(event, campaign.id, index)}
                  >
                    <Checkbox
                      checked={selectedTargetIds.has(campaign.id)}
                      onCheckedChange={() => undefined}
                    />
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--ink)]">
                        {String(index + 1).padStart(2, "0")} · {campaign.campaignName}
                      </span>
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">
                        {campaign.adGroups.length} 组 · {campaign.adGroups.flatMap((group) => group.ads).length} 广告
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="min-h-0 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">选择同步内容</h3>
              <span className="text-xs text-[var(--muted)]">默认同步网址和视频</span>
            </div>
            <div className="mt-3 max-h-[46vh] space-y-3 overflow-auto pr-1">
              {SYNC_FIELD_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
                  <p className="text-xs font-semibold text-[var(--ink)]">{group.title}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {group.fields.map((field) => (
                      <label key={field.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-[var(--canvas-soft)]">
                        <Checkbox
                          checked={selectedFields.has(field.id)}
                          onCheckedChange={(checked) => onToggleField(field.id, checked === true)}
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-[var(--ink)]">{field.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={selectedFields.size === 0 || selectedTargetIds.size === 0}
            type="button"
            onClick={onSync}
          >
            <RefreshCw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            同步
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
