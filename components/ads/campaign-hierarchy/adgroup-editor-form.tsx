"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HierarchySectionLabel, HierarchySummaryCard } from "@/components/ads/hierarchy-item";
import { GENDER_OPTIONS, AGE_OPTIONS } from "@/components/ads/campaign-hierarchy/constants";
import { SelectControl } from "@/components/ads/campaign-hierarchy/field-controls";
import {
  buildGeoTargetSelectOptions,
  buildLanguageTargetSelectOptions,
  summarizeAdCard,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  AdForm,
  AdGroupForm,
  CampaignForm,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { ResourceStatus } from "@/hooks/useAccountResource";

interface AdGroupEditorFormProps {
  campaign: CampaignForm;
  group: AdGroupForm;
  geoTargets: GeoTargetOption[];
  geoTargetState: ResourceStatus;
  languageTargets: LanguageTargetOption[];
  languageTargetState: ResourceStatus;
  // Mutation handlers
  updateCampaignAdGroup: (campaignId: string, groupId: string, patch: Partial<AdGroupForm>) => void;
  toggleAdGroupGender: (campaignId: string, group: AdGroupForm, gender: string, checked: boolean) => void;
  addAd: (campaignId: string, groupId: string) => void;
  removeAd: (campaignId: string, groupId: string, adId: string) => void;
  setEditorFocus: (focus: { level: "ad"; campaignId: string; groupId: string; adId: string } | null) => void;
}

export function AdGroupEditorForm({
  campaign,
  group,
  geoTargets,
  geoTargetState,
  languageTargets,
  languageTargetState,
  updateCampaignAdGroup,
  toggleAdGroupGender,
  addAd,
  removeAd,
  setEditorFocus,
}: AdGroupEditorFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3">
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">广告组名称</label>
          <Input
            className="min-w-0"
            value={group.name}
            onChange={(event) =>
              updateCampaignAdGroup(campaign.id, group.id, { name: event.target.value })
            }
          />
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">地理位置</label>
          <Combobox
            disabled={geoTargetState === "loading"}
            emptyText="没有匹配的地理位置"
            options={buildGeoTargetSelectOptions(geoTargets, group.locations)}
            placeholder="选择地理位置"
            searchPlaceholder="搜索国家、地区、城市或代称"
            value={group.locations}
            onChange={(locations) =>
              updateCampaignAdGroup(campaign.id, group.id, { locations })
            }
          />
        </div>
        <div className="field">
          <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">语言</label>
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
                <div className="flex flex-wrap items-center gap-2">
                  <SelectControl
                    className="h-9 w-20 text-sm"
                    options={AGE_OPTIONS}
                    value={group.ageMin}
                    onChange={(ageMin) =>
                      updateCampaignAdGroup(campaign.id, group.id, { ageMin })
                    }
                  />
                  <span className="text-sm text-[var(--body)]">至</span>
                  <SelectControl
                    className="h-9 w-24 text-sm"
                    options={AGE_OPTIONS}
                    value={group.ageMax}
                    onChange={(ageMax) =>
                      updateCampaignAdGroup(campaign.id, group.id, { ageMax })
                    }
                  />
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

      <div className="space-y-3 border-t border-[var(--hairline)] pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <HierarchySectionLabel>广告 · {group.ads.length}</HierarchySectionLabel>
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => addAd(campaign.id, group.id)}
          >
            <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            新增广告
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.ads.map((ad, adIndex) => (
            <HierarchySummaryCard
              key={ad.id}
              canRemove={group.ads.length > 1}
              index={adIndex + 1}
              levelLabel="广告"
              summary={summarizeAdCard(ad)}
              title={ad.name}
              onOpen={() =>
                setEditorFocus({
                  level: "ad",
                  campaignId: campaign.id,
                  groupId: group.id,
                  adId: ad.id,
                })
              }
              onRemove={() => removeAd(campaign.id, group.id, ad.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}