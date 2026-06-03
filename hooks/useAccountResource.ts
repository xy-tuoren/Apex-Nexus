"use client";

import { useCallback, useEffect, useState } from "react";
import type { GoogleAdAccount, GoogleConversionGoalSet, GoogleMccAccount } from "@/lib/types";
import { buildAccountQueryParams } from "@/lib/google-ads-query";
import type { ConversionGoalPoint, GeoTargetOption, LanguageTargetOption } from "@/components/ads/campaign-hierarchy/types";
import { FALLBACK_GEO_TARGET_OPTIONS, FALLBACK_LANGUAGE_OPTIONS } from "@/components/ads/campaign-hierarchy/constants";

export type ResourceStatus = "idle" | "loading" | "success" | "error";

export interface AccountResources {
  conversionGoals: { data: ConversionGoalPoint[]; status: ResourceStatus; error: string | null; syncedAt: string | null; reload: () => void };
  geoTargets: { data: GeoTargetOption[]; status: ResourceStatus; error: string | null; reload: (query?: string) => void };
  languageTargets: { data: LanguageTargetOption[]; status: ResourceStatus; error: string | null; reload: () => void };
}

function resolveDataMccAccountId(
  adAccountId: string,
  adAccounts: GoogleAdAccount[],
  mccAccounts: GoogleMccAccount[],
) {
  const account = adAccounts.find((item) => item.id === adAccountId);
  const operationMcc = mccAccounts.find((item) => item.id === account?.operationMccId);
  const parentDataMcc = operationMcc?.parentCustomerId
    ? mccAccounts.find(
        (item) => item.kind === "DATA_MCC" && item.customerId === operationMcc.parentCustomerId,
      )
    : null;

  return (
    parentDataMcc?.id ??
    (operationMcc?.kind === "DATA_MCC" ? operationMcc.id : undefined) ??
    mccAccounts.find((item) => item.kind === "DATA_MCC")?.id ??
    null
  );
}

/**
 * Loads all three reference data types (conversion goals, geo targets, language targets)
 * for a single Google Ads account. Call once per adAccountId at the top level of a component.
 */
export function useAccountResources(
  adAccountId: string,
  adAccounts: GoogleAdAccount[],
  mccAccounts: GoogleMccAccount[],
): AccountResources {
  const [conversionGoals, setConversionGoals] = useState<ConversionGoalPoint[]>([]);
  const [conversionGoalStatus, setConversionGoalStatus] = useState<ResourceStatus>("idle");
  const [conversionGoalError, setConversionGoalError] = useState<string | null>(null);
  const [conversionGoalSyncedAt, setConversionGoalSyncedAt] = useState<string | null>(null);

  const [geoTargets, setGeoTargets] = useState<GeoTargetOption[]>(FALLBACK_GEO_TARGET_OPTIONS);
  const [geoTargetStatus, setGeoTargetStatus] = useState<ResourceStatus>("idle");
  const [geoTargetError, setGeoTargetError] = useState<string | null>(null);

  const [languageTargets, setLanguageTargets] = useState<LanguageTargetOption[]>(FALLBACK_LANGUAGE_OPTIONS);
  const [languageTargetStatus, setLanguageTargetStatus] = useState<ResourceStatus>("idle");
  const [languageTargetError, setLanguageTargetError] = useState<string | null>(null);

  const dataMccAccountId = resolveDataMccAccountId(adAccountId, adAccounts, mccAccounts);

  const applyConversionGoalSet = useCallback((goalSet: GoogleConversionGoalSet | null) => {
    setConversionGoals(goalSet?.goals ?? []);
    setConversionGoalSyncedAt(goalSet?.syncedAt ?? null);
  }, []);

  const loadCachedConversionGoals = useCallback(async () => {
    if (!dataMccAccountId) {
      setConversionGoals([]);
      setConversionGoalStatus("idle");
      setConversionGoalError(null);
      setConversionGoalSyncedAt(null);
      return;
    }
    setConversionGoalStatus("loading");
    setConversionGoalError(null);
    try {
      const response = await fetch(`/api/google-ads/mccs/${dataMccAccountId}/conversion-goals`);
      const json = (await response.json()) as { success: boolean; data?: GoogleConversionGoalSet | null; error?: { message: string } };
      if (!json.success) throw new Error(json.error?.message ?? "读取已同步转化目标失败。");
      applyConversionGoalSet(json.data ?? null);
      setConversionGoalStatus("success");
    } catch (err) {
      setConversionGoals([]);
      setConversionGoalStatus("error");
      setConversionGoalSyncedAt(null);
      setConversionGoalError(err instanceof Error ? err.message : "读取已同步转化目标失败。");
    }
  }, [applyConversionGoalSet, dataMccAccountId]);

  const syncConversionGoals = useCallback(async () => {
    if (!dataMccAccountId) {
      setConversionGoals([]);
      setConversionGoalStatus("idle");
      setConversionGoalError(null);
      setConversionGoalSyncedAt(null);
      return;
    }
    setConversionGoalStatus("loading");
    setConversionGoalError(null);
    try {
      const response = await fetch(`/api/google-ads/mccs/${dataMccAccountId}/conversion-goals`, {
        method: "POST",
      });
      const json = (await response.json()) as { success: boolean; data?: GoogleConversionGoalSet; error?: { message: string } };
      if (!json.success || !json.data) throw new Error(json.error?.message ?? "同步数据 MCC 转化目标失败。");
      applyConversionGoalSet(json.data);
      setConversionGoalStatus("success");
    } catch (err) {
      setConversionGoals([]);
      setConversionGoalStatus("error");
      setConversionGoalSyncedAt(null);
      setConversionGoalError(err instanceof Error ? err.message : "同步数据 MCC 转化目标失败。");
    }
  }, [applyConversionGoalSet, dataMccAccountId]);

  const loadGeoTargets = useCallback(async (query = "") => {
    if (!adAccountId) {
      setGeoTargets(FALLBACK_GEO_TARGET_OPTIONS);
      setGeoTargetStatus("idle");
      setGeoTargetError(null);
      return;
    }
    setGeoTargetStatus("loading");
    setGeoTargetError(null);
    try {
      const params = buildAccountQueryParams(adAccountId, adAccounts, mccAccounts);
      if (query.trim()) {
        params.set("query", query.trim());
      }
      const response = await fetch(`/api/google-ads/accounts/${adAccountId}/geo-targets?${params.toString()}`);
      const json = (await response.json()) as { success: boolean; data?: GeoTargetOption[]; error?: { message: string } };
      if (!json.success || !json.data) throw new Error(json.error?.message ?? "读取地理位置失败。");
      setGeoTargets(json.data.length ? json.data : FALLBACK_GEO_TARGET_OPTIONS);
      setGeoTargetStatus("success");
    } catch (err) {
      setGeoTargets(FALLBACK_GEO_TARGET_OPTIONS);
      setGeoTargetStatus("error");
      setGeoTargetError(err instanceof Error ? err.message : "读取地理位置失败。");
    }
  }, [adAccountId, adAccounts, mccAccounts]);

  const loadLanguageTargets = useCallback(async () => {
    if (!adAccountId) {
      setLanguageTargets(FALLBACK_LANGUAGE_OPTIONS);
      setLanguageTargetStatus("idle");
      setLanguageTargetError(null);
      return;
    }
    setLanguageTargetStatus("loading");
    setLanguageTargetError(null);
    try {
      const params = buildAccountQueryParams(adAccountId, adAccounts, mccAccounts);
      const response = await fetch(`/api/google-ads/accounts/${adAccountId}/language-targets?${params.toString()}`);
      const json = (await response.json()) as { success: boolean; data?: LanguageTargetOption[]; error?: { message: string } };
      if (!json.success || !json.data) throw new Error(json.error?.message ?? "读取语言失败。");
      setLanguageTargets(json.data.length ? json.data : FALLBACK_LANGUAGE_OPTIONS);
      setLanguageTargetStatus("success");
    } catch (err) {
      setLanguageTargets(FALLBACK_LANGUAGE_OPTIONS);
      setLanguageTargetStatus("error");
      setLanguageTargetError(err instanceof Error ? err.message : "读取语言失败。");
    }
  }, [adAccountId, adAccounts, mccAccounts]);

  // Auto-load on mount and when account changes
  useEffect(() => {
    void Promise.resolve().then(loadCachedConversionGoals);
  }, [loadCachedConversionGoals]);
  useEffect(() => {
    void Promise.resolve().then(() => loadGeoTargets());
  }, [loadGeoTargets]);
  useEffect(() => {
    void Promise.resolve().then(loadLanguageTargets);
  }, [loadLanguageTargets]);

  return {
    conversionGoals: { data: conversionGoals, status: conversionGoalStatus, error: conversionGoalError, syncedAt: conversionGoalSyncedAt, reload: syncConversionGoals },
    geoTargets: { data: geoTargets, status: geoTargetStatus, error: geoTargetError, reload: loadGeoTargets },
    languageTargets: { data: languageTargets, status: languageTargetStatus, error: languageTargetError, reload: loadLanguageTargets },
  };
}
