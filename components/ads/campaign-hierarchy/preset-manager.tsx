"use client";

import { Layers3, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CampaignPresetEditorForm } from "@/components/ads/campaign-hierarchy/campaign-preset-editor-form";
import { HierarchyEditModal } from "@/components/ads/campaign-hierarchy/hierarchy-edit-modal";
import { PresetTable } from "@/components/ads/campaign-hierarchy/preset-table";
import type { PresetEditorState, PresetTableRow } from "@/components/ads/campaign-hierarchy/preset-utils";
import { formatStableDateTime, summarizeOsDevice } from "@/components/ads/campaign-hierarchy/form-utils";
import type { AccountResources } from "@/hooks/useAccountResource";
import type { CampaignPreset, CampaignPresetPayload } from "@/lib/types";

type PresetApplyDialogProps = {
  open: boolean;
  presets: CampaignPreset[];
  onClose: () => void;
  onApply: (preset: CampaignPreset) => void;
};

export function PresetApplyDialog({ open, presets, onClose, onApply }: PresetApplyDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <HierarchyEditModal
      eyebrow="投放预设"
      maxWidthClassName="sm:max-w-4xl"
      title="选择预设"
      onClose={onClose}
    >
      <div className="grid gap-3">
        {presets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-6 text-sm text-[var(--muted)]">
            暂无预设。
          </p>
        ) : (
          presets.map((preset) => (
            <div key={preset.id} className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[var(--ink)]">{preset.name}</p>
                  {preset.description ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{preset.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {preset.payload.campaignObjective} · {summarizeOsDevice(preset.payload.os, preset.payload.devices)} · 更新于 {formatStableDateTime(preset.updatedAt)}
                  </p>
                </div>
                <Button size="sm" type="button" onClick={() => onApply(preset)}>
                  套用
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </HierarchyEditModal>
  );
}

type PresetManagerProps = {
  open: boolean;
  presets: CampaignPreset[];
  presetEditor: PresetEditorState | null;
  presetTableRows: PresetTableRow[];
  resources: AccountResources;
  deletingPresetIds?: Set<string>;
  isReloading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onReload: () => void;
  onCreate: () => void;
  onEdit: (preset: CampaignPreset) => void;
  onDelete: (presetId: string) => void;
  onSave: () => void;
  onPresetEditorChange: (updater: (current: PresetEditorState | null) => PresetEditorState | null) => void;
};

export function PresetManager({
  open,
  presets,
  presetEditor,
  presetTableRows,
  resources,
  deletingPresetIds,
  isReloading = false,
  isSaving = false,
  onClose,
  onReload,
  onCreate,
  onEdit,
  onDelete,
  onSave,
  onPresetEditorChange,
}: PresetManagerProps) {
  return (
    <Drawer
      open={open}
      direction="right"
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <DrawerContent className="z-[80] h-full max-w-none overflow-hidden rounded-none border-l border-[var(--hairline)] p-0 data-[vaul-drawer-direction=right]:w-[90vw] data-[vaul-drawer-direction=right]:sm:max-w-none">
        <DrawerHeader className="border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-caption-uppercase text-[var(--muted)]">投放预设</p>
              <DrawerTitle className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {presetEditor ? (presetEditor.mode === "create" ? "添加预设" : "编辑预设") : "管理预设"}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                管理广告投放预设
              </DrawerDescription>
            </div>
            <Button aria-label="关闭预设管理" size="icon-sm" type="button" variant="ghost" onClick={onClose}>
              <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
        </DrawerHeader>
        {presetEditor ? (
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-6 py-4">
            <Button disabled={isSaving} size="sm" type="button" variant="outline" onClick={() => onPresetEditorChange(() => null)}>
              返回列表
            </Button>
            <div className="flex items-center gap-2">
              <Button disabled={isSaving} size="sm" type="button" variant="outline" onClick={() => onPresetEditorChange(() => null)}>
                取消
              </Button>
              <Button disabled={isSaving} size="sm" type="button" onClick={() => void onSave()}>
                {isSaving ? (
                  <Spinner aria-hidden className="h-4 w-4" />
                ) : (
                  <Save aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                )}
                {isSaving ? "保存中..." : "保存预设"}
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
            <CampaignPresetEditorForm
              conversionGoals={resources.conversionGoals.data}
              conversionGoalError={resources.conversionGoals.error}
              conversionGoalState={resources.conversionGoals.status}
              conversionGoalSyncedAt={resources.conversionGoals.syncedAt}
              description={presetEditor.description}
              geoTargets={resources.geoTargets.data}
              geoTargetState={resources.geoTargets.status}
              languageTargets={resources.languageTargets.data}
              languageTargetState={resources.languageTargets.status}
              loadConversionGoals={() => resources.conversionGoals.reload()}
              name={presetEditor.name}
              payload={presetEditor.payload}
              onDescriptionChange={(description) =>
                onPresetEditorChange((current) => (current ? { ...current, description } : current))
              }
              onNameChange={(name) =>
                onPresetEditorChange((current) => (current ? { ...current, name } : current))
              }
              onPayloadChange={(payload: CampaignPresetPayload) =>
                onPresetEditorChange((current) => (current ? { ...current, payload } : current))
              }
            />
          </div>
        </div>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-6 py-4">
            <span className="text-sm font-medium text-[var(--ink)]">{presets.length} 套预设</span>
            <div className="flex items-center gap-2">
              <Button disabled={isReloading} size="sm" type="button" variant="outline" onClick={() => void onReload()}>
                {isReloading ? <Spinner aria-hidden className="h-4 w-4" /> : null}
                {isReloading ? "刷新中..." : "刷新列表"}
              </Button>
              <Button size="sm" type="button" onClick={onCreate}>
                <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                添加预设
              </Button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-auto px-6 py-5">
            {isReloading ? (
              <div className="absolute inset-0 z-10 flex items-start justify-center bg-[var(--surface-card)]/60 pt-10 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-medium text-[var(--body)] shadow-[var(--shadow-soft)]">
                  <Spinner aria-hidden className="h-3.5 w-3.5" />
                  正在刷新预设
                </div>
              </div>
            ) : null}
            {presets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)]">
                  <Layers3 aria-hidden className="h-6 w-6 text-[var(--muted)]" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--ink)]">暂无预设</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">点击「添加预设」创建第一套可复用配置。</p>
                </div>
              </div>
            ) : (
              <PresetTable
                deletingPresetIds={deletingPresetIds}
                rows={presetTableRows}
                presets={presets}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
