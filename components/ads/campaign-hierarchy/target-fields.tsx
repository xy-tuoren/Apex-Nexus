"use client";

import { Combobox } from "@/components/ui/combobox";
import { Field } from "@/components/ads/campaign-hierarchy/field-controls";
import {
  buildGeoTargetSelectOptions,
  buildLanguageTargetSelectOptions,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type {
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";
import type { ResourceStatus } from "@/hooks/useAccountResource";

type TargetFieldMode = "field" | "plain";

type TargetFieldsProps = {
  geoTargets: GeoTargetOption[];
  languageTargets: LanguageTargetOption[];
  locationValue: string;
  languageValue: string;
  onLocationChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  geoTargetState?: ResourceStatus;
  languageTargetState?: ResourceStatus;
  locationError?: string;
  languageError?: string;
  mode?: TargetFieldMode;
};

function errorClass(error?: string) {
  return error
    ? "border-[var(--semantic-error)] focus-visible:border-[var(--semantic-error)] focus-visible:ring-[var(--semantic-error)]/10"
    : "";
}

function GeoTargetCombobox({
  disabled,
  geoTargets,
  value,
  onChange,
  error,
}: {
  disabled?: boolean;
  geoTargets: GeoTargetOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Combobox
      className={errorClass(error)}
      disabled={disabled}
      emptyText="没有匹配的国家/地区"
      options={buildGeoTargetSelectOptions(geoTargets, value)}
      placeholder="选择国家/地区"
      searchable
      searchPlaceholder="搜索国家/地区或代称"
      value={value}
      onChange={onChange}
    />
  );
}

function LanguageTargetCombobox({
  disabled,
  languageTargets,
  value,
  onChange,
  error,
}: {
  disabled?: boolean;
  languageTargets: LanguageTargetOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Combobox
      className={errorClass(error)}
      disabled={disabled}
      emptyText="没有匹配的语言"
      options={buildLanguageTargetSelectOptions(languageTargets, value)}
      placeholder="选择语言"
      searchable
      searchPlaceholder="搜索语言或代称"
      value={value}
      onChange={onChange}
    />
  );
}

export function TargetFields({
  geoTargets,
  languageTargets,
  locationValue,
  languageValue,
  onLocationChange,
  onLanguageChange,
  geoTargetState = "success",
  languageTargetState = "success",
  locationError,
  languageError,
  mode = "plain",
}: TargetFieldsProps) {
  const locationControl = (
    <GeoTargetCombobox
      disabled={geoTargetState === "loading"}
      error={locationError}
      geoTargets={geoTargets}
      value={locationValue}
      onChange={onLocationChange}
    />
  );
  const languageControl = (
    <LanguageTargetCombobox
      disabled={languageTargetState === "loading"}
      error={languageError}
      languageTargets={languageTargets}
      value={languageValue}
      onChange={onLanguageChange}
    />
  );

  if (mode === "field") {
    return (
      <>
        <Field label="地理位置" required>
          {locationControl}
        </Field>
        <Field label="语言" required>
          {languageControl}
        </Field>
      </>
    );
  }

  return (
    <>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
          地理位置<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
        </label>
        {locationControl}
        {locationError ? (
          <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{locationError}</p>
        ) : null}
      </div>
      <div className="field">
        <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">
          语言<span className="ml-0.5 text-[var(--semantic-error)]">*</span>
        </label>
        {languageControl}
        {languageError ? (
          <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{languageError}</p>
        ) : null}
      </div>
    </>
  );
}
