"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { MultiCombobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TargetFields } from "@/components/ads/campaign-hierarchy/target-fields";
import {
  AGE_OPTIONS,
  BIDDING_TYPE_OPTIONS,
  CLICK_BIDDING_TYPE_OPTIONS,
  CTA_OPTIONS,
  DEVICE_COMBOBOX_OPTIONS,
  GENDER_OPTIONS,
  OBJECTIVE_OPTIONS,
  OS_COMBOBOX_OPTIONS,
} from "@/components/ads/campaign-hierarchy/constants";
import {
  AssetInputList,
  Field,
  LogoUploadList,
  NumberStepperControl,
  SchedulePicker,
  SelectControl,
  TextList,
} from "@/components/ads/campaign-hierarchy/field-controls";
import {
  formatConversionGoalLabel,
  formatStableDateTime,
  summarizeDevicesSelection,
  summarizeOsSelection,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  CampaignPresetAdGroupPayload,
  CampaignPresetAdPayload,
  CampaignPresetPayload,
} from "@/lib/types";
import type {
  BiddingType,
  ClickBiddingType,
  ConversionGoalPoint,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { ResourceStatus } from "@/hooks/useAccountResource";

type CampaignPresetEditorFormProps = {
  conversionGoals: ConversionGoalPoint[];
  conversionGoalState: ResourceStatus;
  conversionGoalError: string | null;
  conversionGoalSyncedAt: string | null;
  description: string;
  geoTargets: GeoTargetOption[];
  geoTargetState: ResourceStatus;
  languageTargets: LanguageTargetOption[];
  languageTargetState: ResourceStatus;
  loadConversionGoals: () => void;
  name: string;
  payload: CampaignPresetPayload;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPayloadChange: (payload: CampaignPresetPayload) => void;
};

const fieldRow = "grid gap-3 md:grid-cols-2";

function createPresetAd(): CampaignPresetAdPayload {
  return {
    logos: "",
    shortHeadlines: "",
    longHeadlines: "",
    descriptions: "",
    callToAction: "AUTO",
    businessName: "",
  };
}

function createPresetAdGroup(): CampaignPresetAdGroupPayload {
  return {
    locations: "geoTargetConstants/2840",
    language: "all",
    genders: ["FEMALE", "MALE", "UNDETERMINED"],
    ageRanges: ["18", "25", "35", "45", "55", "65"],
    includeUnknownAge: true,
    ads: [createPresetAd()],
  };
}

function toggleValue(values: string[], value: string, checked: boolean) {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }
  return values.filter((item) => item !== value);
}

export function CampaignPresetEditorForm({
  conversionGoals,
  conversionGoalState,
  conversionGoalError,
  conversionGoalSyncedAt,
  description,
  geoTargets,
  geoTargetState,
  languageTargets,
  languageTargetState,
  loadConversionGoals,
  name,
  payload,
  onDescriptionChange,
  onNameChange,
  onPayloadChange,
}: CampaignPresetEditorFormProps) {
  const group = payload.adGroups[0] ?? createPresetAdGroup();
  const ad = group.ads[0] ?? createPresetAd();

  function patchPayload(patch: Partial<CampaignPresetPayload>) {
    onPayloadChange({ ...payload, ...patch });
  }

  function updateGroup(patch: Partial<CampaignPresetAdGroupPayload>) {
    patchPayload({ adGroups: [{ ...group, ...patch }] });
  }

  function updateAd(patch: Partial<CampaignPresetAdPayload>) {
    updateGroup({ ads: [{ ...ad, ...patch }] });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
        <div className={fieldRow}>
          <Field label="预设名称" required>
            <Input value={name} onChange={(event) => onNameChange(event.target.value)} />
          </Field>
          <Field label="描述">
            <Input value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">Campaign 预设</h3>
        <div className="space-y-4">
          <Field label="广告系列目标" required>
            <SelectControl
              options={OBJECTIVE_OPTIONS}
              value={payload.campaignObjective}
              onChange={(campaignObjective) => patchPayload({ campaignObjective })}
            />
          </Field>
          {payload.campaignObjective === "CONVERSIONS" ? (
            <Field label="转化目标" required>
              <div className="space-y-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {conversionGoalState === "success"
                      ? conversionGoalSyncedAt
                        ? `已同步 ${conversionGoals.length} 个目标 · ${formatStableDateTime(conversionGoalSyncedAt)}`
                        : "尚未同步转化目标"
                      : payload.conversionGoal || "待选择"}
                  </p>
                  <Button
                    disabled={conversionGoalState === "loading"}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => loadConversionGoals()}
                  >
                    {conversionGoalState === "loading" ? <Spinner aria-hidden className="h-4 w-4" /> : null}
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
                    value={payload.conversionGoal}
                    onChange={(conversionGoal) => patchPayload({ conversionGoal })}
                  />
                ) : (
                  <Input
                    value={payload.conversionGoal}
                    onChange={(event) => patchPayload({ conversionGoal: event.target.value })}
                  />
                )}
              </div>
            </Field>
          ) : null}
        </div>

        {payload.campaignObjective === "CONVERSIONS" ? (
          <Field label="转化出价类型" required>
            <RadioGroup
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
              value={payload.biddingType}
              onValueChange={(biddingType) => patchPayload({ biddingType: biddingType as BiddingType })}
            >
              {BIDDING_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--body)]">
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </label>
              ))}
            </RadioGroup>
          </Field>
        ) : null}

        {payload.campaignObjective === "CLICKS" ? (
          <Field label="点击出价类型" required>
            <RadioGroup
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
              value={payload.clickBiddingType}
              onValueChange={(clickBiddingType) => patchPayload({ clickBiddingType: clickBiddingType as ClickBiddingType })}
            >
              {CLICK_BIDDING_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--body)]">
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </label>
              ))}
            </RadioGroup>
          </Field>
        ) : null}

        <div className={fieldRow}>
          <Field label="预算" required>
            <NumberStepperControl
              min={1}
              step={1}
              value={payload.budgetDaily}
              onChange={(budgetDaily) => patchPayload({ budgetDaily })}
            />
          </Field>
          {payload.campaignObjective === "CONVERSIONS" && payload.biddingType === "TARGET_CPA" ? (
            <Field label="目标 CPA" required>
              <NumberStepperControl
                min={0.1}
                step={0.1}
                value={payload.targetCpa}
                onChange={(targetCpa) => patchPayload({ targetCpa })}
              />
            </Field>
          ) : null}
          {payload.campaignObjective === "CLICKS" && payload.clickBiddingType === "MAX_CPC" ? (
            <Field label="目标 CPC" required>
              <NumberStepperControl
                min={0.01}
                step={0.01}
                value={payload.targetCpc}
                onChange={(targetCpc) => patchPayload({ targetCpc })}
              />
            </Field>
          ) : null}
        </div>

        <Field label="投放时间" required>
          <SchedulePicker value={payload.adSchedule} onChange={(adSchedule) => patchPayload({ adSchedule })} />
        </Field>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="操作系统" required>
            <MultiCombobox
              formatValue={summarizeOsSelection}
              options={OS_COMBOBOX_OPTIONS}
              placeholder="选择操作系统"
              searchPlaceholder="搜索操作系统"
              selectAllLabel="全部"
              value={payload.os}
              onChange={(os) => patchPayload({ os })}
            />
          </Field>
          <Field label="设备" required>
            <MultiCombobox
              formatValue={summarizeDevicesSelection}
              options={DEVICE_COMBOBOX_OPTIONS}
              placeholder="选择设备"
              searchPlaceholder="搜索设备"
              selectAllLabel="全部"
              value={payload.devices}
              onChange={(devices) => patchPayload({ devices })}
            />
          </Field>
          <Field label="URL 后缀">
            <Input
              value={payload.finalUrlSuffix}
              onChange={(event) => patchPayload({ finalUrlSuffix: event.target.value })}
            />
          </Field>
        </div>
        <Field label="IP 排除">
          <TextList
            placeholder="每行一个 IP 或网段"
            rows={3}
            value={payload.ipExclusions}
            onChange={(ipExclusions) => patchPayload({ ipExclusions })}
          />
        </Field>
        <Field label="名称后缀" hint="套用预设时自动追加到广告系列名称末尾">
          <Input
            placeholder="例如：-000"
            value={payload.campaignNameSuffix ?? ""}
            onChange={(event) => patchPayload({ campaignNameSuffix: event.target.value })}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">AdGroup 预设</h3>
        <div className={fieldRow}>
          <TargetFields
            geoTargetState={geoTargetState}
            geoTargets={geoTargets}
            languageTargetState={languageTargetState}
            languageTargets={languageTargets}
            languageValue={group.language}
            locationValue={group.locations}
            mode="field"
            onLanguageChange={(language) => updateGroup({ language })}
            onLocationChange={(locations) => updateGroup({ locations })}
          />
        </div>

        <div className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
          <Label>受众群体</Label>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2.5fr]">
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
              <p className="mb-2 text-xs font-medium text-[var(--body)]">性别</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {GENDER_OPTIONS.map((gender) => (
                  <label key={gender.value} className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]">
                    <Checkbox
                      checked={group.genders.includes(gender.value)}
                      onCheckedChange={(checked) =>
                        updateGroup({
                          genders: toggleValue(group.genders, gender.value, checked === true),
                        })
                      }
                    />
                    {gender.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
              <p className="mb-2 text-xs font-medium text-[var(--body)]">年龄</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {AGE_OPTIONS.map((ageOption) => (
                  <label key={ageOption.value} className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]">
                    <Checkbox
                      checked={group.ageRanges.includes(ageOption.value)}
                      onCheckedChange={(checked) =>
                        updateGroup({
                          ageRanges: toggleValue(group.ageRanges, ageOption.value, checked === true),
                        })
                      }
                    />
                    {ageOption.label}
                  </label>
                ))}
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]">
                  <Checkbox
                    checked={group.includeUnknownAge}
                    onCheckedChange={(checked) => updateGroup({ includeUnknownAge: checked === true })}
                  />
                  未知
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">Ad 预设</h3>
        <p className="text-xs text-[var(--muted)]">预设不包含广告最终 URL 和视频素材链接。</p>
        <div className={fieldRow}>
          <Field label="商家名称" required>
            <Input
              maxLength={25}
              value={ad.businessName}
              onChange={(event) => updateAd({ businessName: event.target.value })}
            />
          </Field>
          <Field label="号召性用语文字" required>
            <SelectControl
              className="min-w-0 w-full"
              options={CTA_OPTIONS.map(([value, label]) => ({ value, label }))}
              value={ad.callToAction}
              onChange={(callToAction) => updateAd({ callToAction })}
            />
          </Field>
        </div>
        <Field label="徽标">
          <LogoUploadList
            value={ad.logos}
            onChange={(logos) => updateAd({ logos })}
          />
        </Field>
        <Field label="短标题" required>
          <AssetInputList
            key="preset:shortHeadlines"
            maxLength={40}
            placeholder="输入短标题"
            value={ad.shortHeadlines}
            onChange={(shortHeadlines) => updateAd({ shortHeadlines })}
          />
        </Field>
        <Field label="长标题">
          <AssetInputList
            key="preset:longHeadlines"
            maxLength={90}
            placeholder="输入长标题"
            value={ad.longHeadlines}
            onChange={(longHeadlines) => updateAd({ longHeadlines })}
          />
        </Field>
        <Field label="广告内容描述" required>
          <AssetInputList
            key="preset:descriptions"
            maxLength={90}
            placeholder="输入描述"
            value={ad.descriptions}
            onChange={(descriptions) => updateAd({ descriptions })}
          />
        </Field>
      </section>
    </div>
  );
}
