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
  formatStableDateTime,
  summarizeDevicesSelection,
  summarizeOsSelection,
  type AdErrors,
  type AdGroupErrors,
  type CampaignErrors,
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

function inputErrorClass(error?: string) {
  return error ? "border-[var(--semantic-error)] focus-visible:border-[var(--semantic-error)] focus-visible:ring-[var(--semantic-error)]/10" : "";
}

const fluidFieldRow = "flex flex-wrap gap-3 [&>.field]:flex-1 [&>.field]:min-w-[220px]";

interface CampaignEditorFormProps {
  campaign: CampaignForm;
  adAccounts: GoogleAdAccount[];
  syncState: "idle" | "loaded" | "loading" | "success" | "error";
  // Validation
  errors?: CampaignErrors;
  groupErrors?: Record<string, AdGroupErrors>;
  adErrors?: Record<string, AdErrors>;
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
  removeAdGroup: (campaignId: string, groupId: string) => void;
  removeAd: (campaignId: string, groupId: string, adId: string) => void;
  openAdGroupEditor: (campaignId: string, groupId: string) => void;
  openAdEditor: (campaignId: string, groupId: string, adId: string) => void;
}

export function CampaignEditorForm({
  campaign,
  adAccounts,
  syncState,
  errors = {},
  groupErrors = {},
  adErrors = {},
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
  removeAdGroup,
  removeAd,
  openAdGroupEditor,
  openAdEditor,
}: CampaignEditorFormProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-0 xl:self-start">
        <EditorSidebar
          activeGroupId={null}
          adErrors={adErrors}
          campaign={campaign}
          geoTargets={geoTargets}
          groupErrors={groupErrors}
          languageTargets={languageTargets}
          onAddAd={(groupId) => openAdGroupEditor(campaign.id, groupId)}
          onAddGroup={() => addAdGroup(campaign.id)}
          onDuplicateAd={(groupId, adId) => duplicateAd(campaign.id, groupId, adId)}
          onDuplicateGroup={(groupId) => duplicateAdGroup(campaign.id, groupId)}
          onRemoveAd={(groupId, adId) => removeAd(campaign.id, groupId, adId)}
          onRemoveGroup={(groupId) => removeAdGroup(campaign.id, groupId)}
          onOpenAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
          onOpenGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
        />
      </div>

      <div className="space-y-5 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="space-y-4">
          <div className={fluidFieldRow}>
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                账户<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
              </label>
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
              {errors.adAccountId ? (
                <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.adAccountId}</p>
              ) : null}
            </div>
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                广告系列名称<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
              </label>
              <Input
                aria-invalid={Boolean(errors.campaignName)}
                className={inputErrorClass(errors.campaignName)}
                value={campaign.campaignName}
                onChange={(event) =>
                  patchCampaign(campaign.id, { campaignName: event.target.value })
                }
              />
              {errors.campaignName ? (
                <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.campaignName}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              广告系列目标<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
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
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                转化目标<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
              </label>
              <div className={errors.conversionGoal ? "space-y-3 rounded-xl border border-[var(--semantic-error)]/40 bg-[var(--canvas-soft)] p-3" : "space-y-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {conversionGoalState === "success"
                      ? conversionGoalSyncedAt
                        ? `已同步 ${conversionGoals.length} 个目标 · ${formatStableDateTime(conversionGoalSyncedAt)}`
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
              {errors.conversionGoal ? (
                <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.conversionGoal}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {campaign.campaignObjective === "CONVERSIONS" ? (
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                出价类型<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
              </label>
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
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                出价类型<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
              </label>
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
          <div className={fluidFieldRow}>
            <div className="field">
              <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                预算<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
              </label>
              <NumberStepperControl
                min={1}
                step={1}
                value={campaign.budgetDaily}
                onChange={(budgetDaily) => patchCampaign(campaign.id, { budgetDaily })}
              />
              {errors.budgetDaily ? (
                <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.budgetDaily}</p>
              ) : null}
            </div>
            {campaign.campaignObjective === "CONVERSIONS" &&
            campaign.biddingType === "TARGET_CPA" ? (
              <div className="field">
                <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                  目标 CPA<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
                </label>
                <NumberStepperControl
                  min={0.1}
                  step={0.1}
                  value={campaign.targetCpa}
                  onChange={(targetCpa) => patchCampaign(campaign.id, { targetCpa })}
                />
                {errors.targetCpa ? (
                  <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.targetCpa}</p>
                ) : null}
              </div>
            ) : null}
            {campaign.campaignObjective === "CLICKS" &&
            campaign.clickBiddingType === "MAX_CPC" ? (
              <div className="field">
                <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
                  目标 CPC<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
                </label>
                <NumberStepperControl
                  min={0.01}
                  step={0.01}
                  value={campaign.targetCpc}
                  onChange={(targetCpc) => patchCampaign(campaign.id, { targetCpc })}
                />
                {errors.targetCpc ? (
                  <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.targetCpc}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              投放时间<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <SchedulePicker
              value={campaign.adSchedule}
              onChange={(adSchedule) => patchCampaign(campaign.id, { adSchedule })}
            />
          </div>
        </div>

        <div className={`mt-4 ${fluidFieldRow}`}>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              操作系统<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <MultiCombobox
              formatValue={summarizeOsSelection}
              options={OS_COMBOBOX_OPTIONS}
              placeholder="选择操作系统"
              searchPlaceholder="搜索操作系统"
              selectAllLabel="全部"
              value={campaign.os}
              onChange={(os) => patchCampaign(campaign.id, { os })}
            />
            {errors.os ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.os}</p>
            ) : null}
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              设备<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <MultiCombobox
              formatValue={summarizeDevicesSelection}
              options={DEVICE_COMBOBOX_OPTIONS}
              placeholder="选择设备"
              searchPlaceholder="搜索设备"
              selectAllLabel="全部"
              value={campaign.devices}
              onChange={(devices) => patchCampaign(campaign.id, { devices })}
            />
            {errors.devices ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.devices}</p>
            ) : null}
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              URL 后缀<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <Input
              aria-invalid={Boolean(errors.finalUrlSuffix)}
              className={inputErrorClass(errors.finalUrlSuffix)}
              value={campaign.finalUrlSuffix}
              onChange={(event) =>
                patchCampaign(campaign.id, { finalUrlSuffix: event.target.value })
              }
            />
            {errors.finalUrlSuffix ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.finalUrlSuffix}</p>
            ) : null}
          </div>
          <div className="field flex-[2] min-w-[440px]">
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
