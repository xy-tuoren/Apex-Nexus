"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiCombobox } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EditorSidebar } from "@/components/ads/campaign-hierarchy/editor-sidebar";
import {
  BIDDING_TYPE_OPTIONS,
  CLICK_BIDDING_TYPE_OPTIONS,
  DEVICE_COMBOBOX_OPTIONS,
  inputGridClassName,
  OBJECTIVE_OPTIONS,
  OS_COMBOBOX_OPTIONS,
} from "@/components/ads/campaign-hierarchy/constants";
import {
  NumberStepperControl,
  SchedulePicker,
  SelectControl,
  TextList,
} from "@/components/ads/campaign-hierarchy/field-controls";
import {
  defaultBiddingForObjective,
  formatConversionGoalLabel,
  summarizeDevicesSelection,
  summarizeOsSelection,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  BiddingType,
  CampaignForm,
  ClickBiddingType,
  ConversionGoalPoint,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { GoogleAdAccount } from "@/lib/types";
import type { ResourceStatus } from "@/hooks/useAccountResource";

interface CampaignEditorFormProps {
  campaign: CampaignForm;
  adAccounts: GoogleAdAccount[];
  syncState: "idle" | "loaded" | "loading" | "success" | "error";
  // Reference data
  conversionGoals: ConversionGoalPoint[];
  conversionGoalState: ResourceStatus;
  conversionGoalError: string | null;
  conversionGoalSyncedAt: string | null;
  geoTargets: GeoTargetOption[];
  languageTargets: LanguageTargetOption[];
  // Mutation handlers
  patchCampaign: (campaignId: string, patch: Partial<CampaignForm>) => void;
  loadConversionGoals: () => void;
  addAdGroup: (campaignId: string) => void;
  duplicateAdGroup: (campaignId: string, groupId: string) => void;
  duplicateAd: (campaignId: string, groupId: string, adId: string) => void;
  openAdGroupEditor: (campaignId: string, groupId: string) => void;
  openAdEditor: (campaignId: string, groupId: string, adId: string) => void;
}

export function CampaignEditorForm({
  campaign,
  adAccounts,
  syncState,
  conversionGoals,
  conversionGoalState,
  conversionGoalError,
  conversionGoalSyncedAt,
  geoTargets,
  languageTargets,
  patchCampaign,
  loadConversionGoals,
  addAdGroup,
  duplicateAdGroup,
  duplicateAd,
  openAdGroupEditor,
  openAdEditor,
}: CampaignEditorFormProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-0 xl:self-start">
        <EditorSidebar
          activeGroupId={null}
          campaign={campaign}
          geoTargets={geoTargets}
          languageTargets={languageTargets}
          onAddAd={(groupId) => openAdGroupEditor(campaign.id, groupId)}
          onAddGroup={() => addAdGroup(campaign.id)}
          onDuplicateAd={(groupId, adId) => duplicateAd(campaign.id, groupId, adId)}
          onDuplicateGroup={(groupId) => duplicateAdGroup(campaign.id, groupId)}
          onOpenAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
          onOpenGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
        />
      </div>

      <div className="space-y-5 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="space-y-4">
          <div className={inputGridClassName}>
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">账户</label>
              <SelectControl
                disabled={syncState === "loading" || adAccounts.length === 0}
                options={adAccounts.map((account) => ({
                  value: account.id,
                  label: `${account.name} · ${account.customerId}`,
                }))}
                placeholder="请选择账号"
                value={campaign.adAccountId}
                onChange={(adAccountId) => {
                  patchCampaign(campaign.id, { adAccountId, conversionGoal: "" });
                }}
              />
            </div>
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">广告系列名称</label>
              <Input
                value={campaign.campaignName}
                onChange={(event) =>
                  patchCampaign(campaign.id, { campaignName: event.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">广告系列目标</label>
            <SelectControl
              options={OBJECTIVE_OPTIONS}
              value={campaign.campaignObjective}
              onChange={(campaignObjective) =>
                patchCampaign(campaign.id, {
                  campaignObjective,
                  ...defaultBiddingForObjective(campaignObjective),
                })
              }
            />
          </div>

          {campaign.campaignObjective === "CONVERSIONS" ? (
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">转化目标</label>
              <div className="space-y-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {conversionGoalState === "success"
                      ? conversionGoalSyncedAt
                        ? `已同步 ${conversionGoals.length} 个目标 · ${new Date(conversionGoalSyncedAt).toLocaleString()}`
                        : "尚未同步转化目标"
                      : campaign.conversionGoal || "待选择"}
                  </p>
                  <Button
                    disabled={!campaign.adAccountId || conversionGoalState === "loading"}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => loadConversionGoals()}
                  >
                    {conversionGoalState === "loading" ? "同步中..." : "同步目标"}
                  </Button>
                </div>
                {conversionGoalError ? (
                  <p className="rounded-lg border border-[var(--semantic-error)]/30 px-3 py-2 text-xs leading-relaxed text-[var(--semantic-error)]">
                    {conversionGoalError}
                  </p>
                ) : null}
                {conversionGoals.length > 0 ? (
                  <SelectControl
                    options={conversionGoals.map((goal) => ({
                      value: goal.id,
                      label: formatConversionGoalLabel(goal),
                    }))}
                    value={campaign.conversionGoal}
                    onChange={(conversionGoal) =>
                      patchCampaign(campaign.id, { conversionGoal })
                    }
                  />
                ) : (
                  <Input
                    value={campaign.conversionGoal}
                    onChange={(event) =>
                      patchCampaign(campaign.id, { conversionGoal: event.target.value })
                    }
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {campaign.campaignObjective === "CONVERSIONS" ? (
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">出价类型</label>
              <RadioGroup
                className="flex flex-wrap items-center gap-x-5 gap-y-2"
                value={campaign.biddingType}
                onValueChange={(biddingType) =>
                  patchCampaign(campaign.id, { biddingType: biddingType as BiddingType })
                }
              >
                {BIDDING_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--body)] transition-colors hover:text-[var(--ink)]"
                  >
                    <RadioGroupItem value={option.value} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          ) : null}
          {campaign.campaignObjective === "CLICKS" ? (
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">出价类型</label>
              <RadioGroup
                className="flex flex-wrap items-center gap-x-5 gap-y-2"
                value={campaign.clickBiddingType}
                onValueChange={(clickBiddingType) =>
                  patchCampaign(campaign.id, {
                    clickBiddingType: clickBiddingType as ClickBiddingType,
                  })
                }
              >
                {CLICK_BIDDING_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--body)] transition-colors hover:text-[var(--ink)]"
                  >
                    <RadioGroupItem value={option.value} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          ) : null}
          <div className={inputGridClassName}>
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">预算</label>
              <NumberStepperControl
                min={1}
                step={1}
                value={campaign.budgetDaily}
                onChange={(budgetDaily) => patchCampaign(campaign.id, { budgetDaily })}
              />
            </div>
            {campaign.campaignObjective === "CONVERSIONS" &&
            campaign.biddingType === "TARGET_CPA" ? (
              <div className="field">
                <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">目标 CPA</label>
                <NumberStepperControl
                  min={0.1}
                  step={0.1}
                  value={campaign.targetCpa}
                  onChange={(targetCpa) => patchCampaign(campaign.id, { targetCpa })}
                />
              </div>
            ) : null}
            {campaign.campaignObjective === "CLICKS" &&
            campaign.clickBiddingType === "MAX_CPC" ? (
              <div className="field">
                <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">目标 CPC</label>
                <NumberStepperControl
                  min={0.01}
                  step={0.01}
                  value={campaign.targetCpc}
                  onChange={(targetCpc) => patchCampaign(campaign.id, { targetCpc })}
                />
              </div>
            ) : null}
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">投放时间</label>
            <SchedulePicker
              value={campaign.adSchedule}
              onChange={(adSchedule) => patchCampaign(campaign.id, { adSchedule })}
            />
          </div>
        </div>

        <div className={`mt-4 ${inputGridClassName}`}>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">操作系统</label>
            <MultiCombobox
              formatValue={summarizeOsSelection}
              options={OS_COMBOBOX_OPTIONS}
              placeholder="选择操作系统"
              searchPlaceholder="搜索操作系统"
              selectAllLabel="全部"
              value={campaign.os}
              onChange={(os) => patchCampaign(campaign.id, { os })}
            />
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">设备</label>
            <MultiCombobox
              formatValue={summarizeDevicesSelection}
              options={DEVICE_COMBOBOX_OPTIONS}
              placeholder="选择设备"
              searchPlaceholder="搜索设备"
              selectAllLabel="全部"
              value={campaign.devices}
              onChange={(devices) => patchCampaign(campaign.id, { devices })}
            />
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">URL 后缀</label>
            <Input
              value={campaign.finalUrlSuffix}
              onChange={(event) =>
                patchCampaign(campaign.id, { finalUrlSuffix: event.target.value })
              }
            />
          </div>
          <div className="field lg:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">IP 地址排除</label>
            <TextList
              placeholder="每行一个 IP 或 CIDR"
              rows={3}
              value={campaign.ipExclusions}
              onChange={(ipExclusions) => patchCampaign(campaign.id, { ipExclusions })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
