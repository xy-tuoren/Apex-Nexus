"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditorSidebar } from "@/components/ads/campaign-hierarchy/editor-sidebar";
import { GENDER_OPTIONS, AGE_OPTIONS } from "@/components/ads/campaign-hierarchy/constants";
import {
  buildGeoTargetSelectOptions,
  buildLanguageTargetSelectOptions,
  type AdErrors,
  type AdGroupErrors,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  AdGroupForm,
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { ResourceStatus } from "@/hooks/useAccountResource";

function inputErrorClass(error?: string) {
  return error ? "border-[var(--semantic-error)] focus-visible:border-[var(--semantic-error)] focus-visible:ring-[var(--semantic-error)]/10" : "";
}

interface AdGroupEditorFormProps {
  campaign: CampaignForm;
  group: AdGroupForm;
  errors?: AdGroupErrors;
  groupErrors?: Record<string, AdGroupErrors>;
  adErrors?: Record<string, AdErrors>;
  geoTargets: GeoTargetOption[];
  geoTargetState: ResourceStatus;
  languageTargets: LanguageTargetOption[];
  languageTargetState: ResourceStatus;
  // Mutation handlers
  updateCampaignAdGroup: (campaignId: string, groupId: string, patch: Partial<AdGroupForm>) => void;
  toggleAdGroupGender: (campaignId: string, group: AdGroupForm, gender: string, checked: boolean) => void;
  toggleAdGroupAgeRange: (campaignId: string, group: AdGroupForm, ageRange: string, checked: boolean) => void;
  addAd: (campaignId: string, groupId: string) => void;
  duplicateAdGroup: (campaignId: string, groupId: string) => void;
  duplicateAd: (campaignId: string, groupId: string, adId: string) => void;
  removeAdGroup: (campaignId: string, groupId: string) => void;
  removeAd: (campaignId: string, groupId: string, adId: string) => void;
  openAdGroupEditor: (campaignId: string, groupId: string) => void;
  openAdEditor: (campaignId: string, groupId: string, adId: string) => void;
}

export function AdGroupEditorForm({
  campaign,
  group,
  errors = {},
  groupErrors = {},
  adErrors = {},
  geoTargets,
  geoTargetState,
  languageTargets,
  languageTargetState,
  updateCampaignAdGroup,
  toggleAdGroupGender,
  toggleAdGroupAgeRange,
  addAd,
  duplicateAdGroup,
  duplicateAd,
  removeAdGroup,
  removeAd,
  openAdGroupEditor,
  openAdEditor,
}: AdGroupEditorFormProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-0 xl:self-start">
        <EditorSidebar
          activeGroupId={group.id}
          adErrors={adErrors}
          campaign={campaign}
          geoTargets={geoTargets}
          groupErrors={groupErrors}
          languageTargets={languageTargets}
          onAddAd={(groupId) => addAd(campaign.id, groupId)}
          onDuplicateAd={(groupId, adId) => duplicateAd(campaign.id, groupId, adId)}
          onDuplicateGroup={(groupId) => duplicateAdGroup(campaign.id, groupId)}
          onRemoveAd={(groupId, adId) => removeAd(campaign.id, groupId, adId)}
          onRemoveGroup={(groupId) => removeAdGroup(campaign.id, groupId)}
          onOpenAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
          onOpenGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
        />
      </div>

      <div className="space-y-5 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="grid gap-3">
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              广告组名称<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <Input
              aria-invalid={Boolean(errors.name)}
              className={inputErrorClass(errors.name)}
              value={group.name}
              onChange={(event) =>
                updateCampaignAdGroup(campaign.id, group.id, { name: event.target.value })
              }
            />
            {errors.name ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.name}</p>
            ) : null}
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              地理位置<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <Combobox
              disabled={geoTargetState === "loading"}
              emptyText="没有匹配的国家/地区"
              options={buildGeoTargetSelectOptions(geoTargets, group.locations)}
              placeholder="选择国家/地区"
              searchPlaceholder="搜索国家/地区或代称"
              value={group.locations}
              onChange={(locations) =>
                updateCampaignAdGroup(campaign.id, group.id, { locations })
              }
            />
            {errors.locations ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.locations}</p>
            ) : null}
          </div>
          <div className="field">
            <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
              语言<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
            </label>
            <Combobox
              disabled={languageTargetState === "loading"}
              emptyText="没有匹配的语言"
              options={buildLanguageTargetSelectOptions(languageTargets, group.language)}
              placeholder="选择语言"
              searchPlaceholder="搜索语言或代称"
              value={group.language}
              onChange={(language) =>
                updateCampaignAdGroup(campaign.id, group.id, { language })
              }
            />
            {errors.language ? (
              <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{errors.language}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>受众群体</Label>
            <div className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
              <p className="mb-2 text-sm font-medium text-[var(--body-strong)]">
                具有以下受众特征的用户
              </p>
              <div className="grid gap-2">
                <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-2.5">
                  <p className="mb-2 text-xs font-medium text-[var(--body)]">性别</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {GENDER_OPTIONS.map((gender) => (
                      <label
                        key={gender.value}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]"
                      >
                        <Checkbox
                          checked={group.genders.includes(gender.value)}
                          onCheckedChange={(checked) =>
                            toggleAdGroupGender(
                              campaign.id,
                              group,
                              gender.value,
                              checked === true,
                            )
                          }
                        />
                        {gender.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-2.5">
                  <p className="mb-2 text-xs font-medium text-[var(--body)]">年龄</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {AGE_OPTIONS.map((ageOption) => (
                      <label
                        key={ageOption.value}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]"
                      >
                        <Checkbox
                          checked={group.ageRanges.includes(ageOption.value)}
                          onCheckedChange={(checked) =>
                            toggleAdGroupAgeRange(
                              campaign.id,
                              group,
                              ageOption.value,
                              checked === true,
                            )
                          }
                        />
                        {ageOption.label}
                      </label>
                    ))}
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--body-strong)]">
                      <Checkbox
                        checked={group.includeUnknownAge}
                        onCheckedChange={(checked) =>
                          updateCampaignAdGroup(campaign.id, group.id, {
                            includeUnknownAge: checked === true,
                          })
                        }
                      />
                      未知
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
