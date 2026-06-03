"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  CampaignOverviewAddTile,
  CampaignOverviewCard,
} from "@/components/ads/campaign-overview";
import { HierarchyEditModal } from "@/components/ads/campaign-hierarchy/hierarchy-edit-modal";
import {
  FALLBACK_GEO_TARGET_OPTIONS,
  FALLBACK_LANGUAGE_OPTIONS,
  OBJECTIVE_OPTIONS,
} from "@/components/ads/campaign-hierarchy/constants";
import {
  buildCampaignHighlights,
  buildCampaignOverviewMeta,
  buildDefaultCampaign,
  buildPayloadFromCampaign,
  createDefaultAd,
  createDefaultAdGroup,
  extractGoogleAdsErrors,
  formatSchedule,
  notificationMessageFromResult,
  splitLines,
  splitMultiline,
  successMessageFromResult,
  summarizeOsDevice,
} from "@/components/ads/campaign-hierarchy/form-utils";
import { CampaignEditorForm } from "@/components/ads/campaign-hierarchy/campaign-editor-form";
import { AdGroupEditorForm } from "@/components/ads/campaign-hierarchy/adgroup-editor-form";
import { AdEditorForm } from "@/components/ads/campaign-hierarchy/ad-editor-form";
import { useAccountResources } from "@/hooks/useAccountResource";
import type {
  AdForm,
  AdGroupForm,
  ApiResult,
  CampaignForm,
  EditorFocus,
} from "@/components/ads/campaign-hierarchy/types";
import type { GoogleAdAccount, GoogleMccAccount } from "@/lib/types";
import type { CampaignHierarchyEditorProps } from "@/components/ads/campaign-hierarchy/types";

const MAX_ACCOUNTS = 4;

export function CampaignHierarchyEditor({
  initialAdAccounts,
  accountSyncError: initialSyncError = null,
  accountsSyncedAt: initialSyncedAt = null,
  initialMccAccounts = [],
}: CampaignHierarchyEditorProps) {
  const { notify } = useToast();
  const [adAccounts, setAdAccounts] = useState<GoogleAdAccount[]>(initialAdAccounts);
  const [mccAccounts, setMccAccounts] = useState<GoogleMccAccount[]>(initialMccAccounts);
  const [syncState, setSyncState] = useState<"idle" | "loaded" | "loading" | "success" | "error">(() => {
    if (initialSyncError) return "error";
    if (initialAdAccounts.length > 0) return "loaded";
    return "idle";
  });
  const [syncError, setSyncError] = useState<string | null>(initialSyncError);
  const [syncedAt, setSyncedAt] = useState<string | null>(initialSyncedAt);

  const initialCampaignIdRef = useRef(`cmp_1_${Date.now()}`);
  const [campaigns, setCampaigns] = useState<CampaignForm[]>(() => {
    const initial = { ...buildDefaultCampaign(1, initialAdAccounts[0]), id: initialCampaignIdRef.current };
    return [initial];
  });
  const [result, setResult] = useState<ApiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idCounterRef = useRef(2);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [isCampaignEditorOpen, setIsCampaignEditorOpen] = useState(false);
  const [editorFocus, setEditorFocus] = useState<EditorFocus | null>(null);
  const [previewCampaignId, setPreviewCampaignId] = useState<string | null>(null);

  // Unique account IDs present in campaigns — max 4
  const accountIdsKey = useMemo(
    () =>
      [...new Set(campaigns.map((c) => c.adAccountId).filter(Boolean))]
        .sort()
        .join(","),
    [campaigns],
  );

  // Derive up to MAX_ACCOUNTS unique account IDs
  const accountIds = useMemo(() => {
    const ids = accountIdsKey ? accountIdsKey.split(",") : [];
    return ids.slice(0, MAX_ACCOUNTS);
  }, [accountIdsKey]);

  // Call useAccountResources at TOP LEVEL for each unique account
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resources0 = accountIds[0] ? useAccountResources(accountIds[0], adAccounts, mccAccounts) : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resources1 = accountIds[1] ? useAccountResources(accountIds[1], adAccounts, mccAccounts) : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resources2 = accountIds[2] ? useAccountResources(accountIds[2], adAccounts, mccAccounts) : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resources3 = accountIds[3] ? useAccountResources(accountIds[3], adAccounts, mccAccounts) : null;

  const allResources = useMemo(() => {
    const map: Record<string, ReturnType<typeof useAccountResources>> = {};
    if (accountIds[0]) map[accountIds[0]] = resources0!;
    if (accountIds[1]) map[accountIds[1]] = resources1!;
    if (accountIds[2]) map[accountIds[2]] = resources2!;
    if (accountIds[3]) map[accountIds[3]] = resources3!;
    return map;
  }, [accountIds, resources0, resources1, resources2, resources3]);

  // Auto-pick first conversion goal when loaded
  useEffect(() => {
    for (const campaign of campaigns) {
      const r = allResources[campaign.adAccountId];
      if (r?.conversionGoals.status !== "success" || r.conversionGoals.data.length === 0) {
        continue;
      }

      const hasSelectedGoal = r.conversionGoals.data.some(
        (goal) => goal.id === campaign.conversionGoal,
      );
      if (!hasSelectedGoal) {
        patchCampaign(campaign.id, { conversionGoal: r.conversionGoals.data[0]?.id ?? "" });
      }
    }
  }, [allResources, campaigns]);

  function closeCampaignEditor() {
    setIsCampaignEditorOpen(false);
    setActiveCampaignId(null);
    setEditorFocus(null);
  }

  function closeFocusedEditor() {
    setEditorFocus(null);
    if (!isCampaignEditorOpen) {
      setActiveCampaignId(null);
    }
  }

  function returnToCampaignEditor() {
    if (!activeCampaignId) {
      return;
    }
    setEditorFocus(null);
    setIsCampaignEditorOpen(true);
  }

  function clearEditorFocusForGroup(campaignId: string, groupId: string) {
    setEditorFocus((current) => {
      if (!current || current.campaignId !== campaignId) return current;
      if (current.level === "adgroup" && current.groupId === groupId) return null;
      if (current.level === "ad" && current.groupId === groupId) return null;
      return current;
    });
  }

  function clearEditorFocusForAd(campaignId: string, groupId: string, adId: string) {
    setEditorFocus((current) => {
      if (current?.level === "ad" && current.campaignId === campaignId && current.groupId === groupId && current.adId === adId) {
        return { level: "adgroup", campaignId, groupId };
      }
      return current;
    });
  }

  function patchCampaign(campaignId: string, patch: Partial<CampaignForm>) {
    setCampaigns((current) =>
      current.map((c) => (c.id === campaignId ? { ...c, ...patch } : c)),
    );
  }

  function updateCampaignAdGroup(campaignId: string, groupId: string, patch: Partial<AdGroupForm>) {
    setCampaigns((current) =>
      current.map((c) =>
        c.id === campaignId
          ? { ...c, adGroups: c.adGroups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) }
          : c,
      ),
    );
  }

  function updateCampaignAd(campaignId: string, groupId: string, adId: string, patch: Partial<AdForm>) {
    setCampaigns((current) =>
      current.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((g) =>
                g.id === groupId
                  ? { ...g, ads: g.ads.map((a) => (a.id === adId ? { ...a, ...patch } : a)) }
                  : g,
              ),
            }
          : c,
      ),
    );
  }

  function toggleAdGroupGender(campaignId: string, group: AdGroupForm, gender: string, checked: boolean) {
    const genders = checked
      ? Array.from(new Set([...group.genders, gender]))
      : group.genders.filter((g) => g !== gender);
    updateCampaignAdGroup(campaignId, group.id, { genders });
  }

  function toggleAdGroupAgeRange(campaignId: string, group: AdGroupForm, ageRange: string, checked: boolean) {
    const ageRanges = checked
      ? Array.from(new Set([...group.ageRanges, ageRange]))
      : group.ageRanges.filter((value) => value !== ageRange);
    updateCampaignAdGroup(campaignId, group.id, { ageRanges });
  }

  function openCampaignDetail(campaignId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    if (!campaign.adAccountId && adAccounts[0]) {
      patchCampaign(campaignId, { adAccountId: adAccounts[0].id });
    }
    setActiveCampaignId(campaignId);
    setIsCampaignEditorOpen(true);
    setEditorFocus(null);
  }

  function openAdGroupEditor(campaignId: string, groupId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    if (!campaign.adAccountId && adAccounts[0]) {
      patchCampaign(campaignId, { adAccountId: adAccounts[0].id });
    }
    setActiveCampaignId(campaignId);
    setIsCampaignEditorOpen(false);
    setEditorFocus({ level: "adgroup", campaignId, groupId });
  }

  function openAdEditor(campaignId: string, groupId: string, adId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    if (!campaign.adAccountId && adAccounts[0]) {
      patchCampaign(campaignId, { adAccountId: adAccounts[0].id });
    }
    setActiveCampaignId(campaignId);
    setIsCampaignEditorOpen(false);
    setEditorFocus({ level: "ad", campaignId, groupId, adId });
  }

  function addCampaign() {
    const nextIndex = campaigns.length + 1;
    const id = `cmp_${nextIndex}_${idCounterRef.current++}`;
    const nextCampaign = { ...buildDefaultCampaign(nextIndex, adAccounts[0]), id };
    setCampaigns((current) => [...current, nextCampaign]);
    setActiveCampaignId(id);
    setIsCampaignEditorOpen(true);
    setEditorFocus(null);
  }

  function removeCampaign(campaignId: string) {
    if (campaigns.length === 1) return;
    setCampaigns((current) => current.filter((c) => c.id !== campaignId));
    if (activeCampaignId === campaignId) closeCampaignEditor();
  }

  function addAdGroup(campaignId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    const id = `adg_${campaign.adGroups.length + 1}_${idCounterRef.current++}`;
    const nextGroup = {
      ...createDefaultAdGroup(campaign.adGroups.length + 1),
      id,
      ads: [{ ...createDefaultAd(1), id: `${id}_ad_1` }],
    };
    patchCampaign(campaignId, { adGroups: [...campaign.adGroups, nextGroup] });
  }

  function removeAdGroup(campaignId: string, groupId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign || campaign.adGroups.length === 1) return;
    patchCampaign(campaignId, { adGroups: campaign.adGroups.filter((g) => g.id !== groupId) });
    clearEditorFocusForGroup(campaignId, groupId);
  }

  function addAd(campaignId: string, groupId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    const group = campaign?.adGroups.find((g) => g.id === groupId);
    if (!group) return;
    const id = `${groupId}_ad_${group.ads.length + 1}_${idCounterRef.current++}`;
    const nextAd = {
      ...createDefaultAd(group.ads.length + 1),
      id,
      finalUrl: group.ads[0]?.finalUrl ?? "https://example.com/landing",
    };
    updateCampaignAdGroup(campaignId, groupId, { ads: [...group.ads, nextAd] });
  }

  function removeAd(campaignId: string, groupId: string, adId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    const group = campaign?.adGroups.find((g) => g.id === groupId);
    if (!group || group.ads.length === 1) return;
    updateCampaignAdGroup(campaignId, groupId, { ads: group.ads.filter((a) => a.id !== adId) });
    clearEditorFocusForAd(campaignId, groupId, adId);
  }

  // Sync
  const syncGoogleAccounts = useCallback(async () => {
    setSyncState("loading");
    setSyncError(null);
    try {
      const response = await fetch("/api/accounts/sync", { method: "POST" });
      const json = (await response.json()) as ApiResult;
      if (!json.success || !json.data) throw new Error(json.error?.message ?? "同步 Google Ads 账号失败。");
      const data = json.data as { mccAccounts: GoogleMccAccount[]; adAccounts: GoogleAdAccount[]; syncedAt: string };
      setMccAccounts(data.mccAccounts);
      setAdAccounts(data.adAccounts);
      setSyncedAt(data.syncedAt);
      setCampaigns((current) =>
        current.map((c) => {
          const account = data.adAccounts.find((a) => a.id === c.adAccountId) ?? data.adAccounts[0];
          if (!account) return c;
          return { ...c, adAccountId: account.id };
        }),
      );
      setSyncState("success");
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "同步 Google Ads 账号失败。");
    }
  }, []);

  // Submit
  async function submitDrafts() {
    setIsSubmitting(true);
    setResult(null);
    try {
      const firstAdFallback = createDefaultAd(1);
      let lastResult: ApiResult | null = null;
      let submittedCount = 0;
      for (const campaign of campaigns) {
        const payload = buildPayloadFromCampaign(campaign, firstAdFallback);
        const createResponse = await fetch("/api/campaign-drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const createJson = (await createResponse.json()) as ApiResult;
        lastResult = createJson;
        const draftId =
          createJson.success && createJson.data && typeof createJson.data === "object" && "id" in createJson.data
            ? String(createJson.data.id)
            : "";
        if (!draftId) {
          notify({ tone: "error", title: createJson.error?.code ?? "草稿创建失败", description: notificationMessageFromResult(createJson) });
          setResult(createJson);
          return;
        }
        const launchResponse = await fetch("/api/launch-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId, idempotencyKey: `launch:${draftId}:${Date.now()}` }),
        });
        const launchJson = (await launchResponse.json()) as ApiResult;
        lastResult = launchJson;
        if (!launchJson.success) {
          const failedResult = {
            ...launchJson,
            data: { failedCampaignId: campaign.id },
          } satisfies ApiResult;
          notify({ tone: "error", title: failedResult.error?.code ?? "Google Ads 推送失败", description: notificationMessageFromResult(failedResult) });
          setResult(failedResult);
          return;
        }
        submittedCount += 1;
      }
      const successResult = lastResult
        ? { ...lastResult, success: true as const, data: { message: `已提交 ${submittedCount} 个广告系列到 Google Ads。` }, error: undefined }
        : { success: true as const, data: { message: "没有可提交的广告系列。" } };
      notify({ tone: "success", title: "提交成功", description: successMessageFromResult(successResult, `已提交 ${submittedCount} 个广告系列到 Google Ads。`) });
      setResult(successResult);
    } catch (error) {
      const failureResult: ApiResult = { success: false, error: { code: "CLIENT_SUBMIT_FAILED", message: error instanceof Error ? error.message : "提交草稿失败。" } };
      console.error("Google Ads submit failed", error);
      notify({ tone: "error", title: failureResult.error?.code ?? "提交失败", description: notificationMessageFromResult(failureResult) });
      setResult(failureResult);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Derived state
  const activeEditorCampaignId = editorFocus?.campaignId ?? activeCampaignId;
  const activeCampaign = activeEditorCampaignId ? campaigns.find((c) => c.id === activeEditorCampaignId) ?? null : null;
  const shouldShowCampaignEditor = Boolean(activeCampaign && isCampaignEditorOpen && !editorFocus);
  const editorFocusGroupId = editorFocus && editorFocus.campaignId === activeCampaign?.id ? editorFocus.groupId : null;
  const activeEditorGroup = activeCampaign && editorFocusGroupId ? activeCampaign.adGroups.find((g) => g.id === editorFocusGroupId) ?? null : null;
  const activeEditorAd = editorFocus?.level === "ad" && activeEditorGroup ? activeEditorGroup.ads.find((a) => a.id === editorFocus.adId) ?? null : null;
  const previewCampaign = previewCampaignId ? campaigns.find((c) => c.id === previewCampaignId) ?? null : null;
  const totalAdGroups = campaigns.reduce((t, c) => t + c.adGroups.length, 0);
  const totalAds = campaigns.reduce((t, c) => t + c.adGroups.reduce((gt, g) => gt + g.ads.length, 0), 0);
  const campaignSlots = Array.from({ length: 4 }, (_, i) => campaigns[i] ?? null);

  function getResources(adAccountId: string) {
    return allResources[adAccountId] ?? null;
  }

  function renderCampaignPreview(campaign: CampaignForm) {
    const account = adAccounts.find((a) => a.id === campaign.adAccountId);
    const r = getResources(campaign.adAccountId);
    const highlights = buildCampaignHighlights(campaign, r?.geoTargets.data, r?.languageTargets.data);
    return (
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-3xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4">
          <p className="text-caption-uppercase text-[var(--muted)]">Campaign Snapshot</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{campaign.campaignName}</h3>
          <div className="mt-4 grid gap-2 text-sm text-[var(--body)]">
            <p>账号：{account ? `${account.name} · ${account.customerId}` : "未选择"}</p>
            <p>目标：{OBJECTIVE_OPTIONS.find((o: { value: string }) => o.value === campaign.campaignObjective)?.label}</p>
            <p>预算：{campaign.budgetDaily} / day</p>
            <p>出价：{campaign.campaignObjective === "CLICKS" ? campaign.clickBiddingType : campaign.biddingType}</p>
            <p>设备：{summarizeOsDevice(campaign.os, campaign.devices)}</p>
            <p>时间：{formatSchedule(campaign.adSchedule)}</p>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
            <p className="text-xs font-semibold text-[var(--ink)]">投放摘要</p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[var(--body)]">
              {highlights.map((line: string, index: number) => <li key={`${line}-${index}`}>{line}</li>)}
            </ul>
          </div>
        </section>
        <section className="space-y-3">
          {campaign.adGroups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-caption-uppercase text-[var(--muted)]">AdGroup {String(groupIndex + 1).padStart(2, "0")}</p>
                  <h4 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">{group.name}</h4>
                </div>
                <Badge className="normal-case tracking-normal">{group.ads.length} Ads</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.ads.map((ad, adIndex) => (
                  <div key={ad.id} className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Ad {String(adIndex + 1).padStart(2, "0")}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{ad.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--body)]">{splitLines(ad.shortHeadlines).slice(0, 2).join(" / ")}</p>
                    <p className="mt-2 truncate text-[11px] text-[var(--muted)]">{ad.finalUrl}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  function operationLabelForCampaign(campaign: CampaignForm, operationIndex: number | null) {
    if (operationIndex === null) {
      return null;
    }

    const operations: Array<{ label: string; detail?: string }> = [
      { label: "广告系列预算", detail: campaign.budgetDaily },
      { label: "广告系列", detail: campaign.campaignName },
    ];
    const allGenders = ["FEMALE", "MALE", "UNDETERMINED"];
    const ageBuckets = ["18", "25", "35", "45", "55", "65"];

    campaign.adGroups.forEach((group, groupIndex) => {
      const groupLabel = `广告组 ${groupIndex + 1}：${group.name}`;
      operations.push({ label: groupLabel, detail: "创建广告组" });

      splitLines(group.locations)
        .filter((location) => location.startsWith("geoTargetConstants/"))
        .forEach((location) => {
          operations.push({ label: groupLabel, detail: `地理位置 ${location}` });
        });

      if (group.language.startsWith("languageConstants/")) {
        operations.push({ label: groupLabel, detail: `语言 ${group.language}` });
      }

      const selectedGenders = Array.from(
        new Set(group.genders.filter((gender) => allGenders.includes(gender))),
      );
      if (selectedGenders.length > 0 && selectedGenders.length < allGenders.length) {
        selectedGenders.forEach((gender) => {
          operations.push({ label: groupLabel, detail: `性别 ${gender}` });
        });
      }

      const selectedAges = Array.from(
        new Set(group.ageRanges.filter((age) => ageBuckets.includes(age))),
      );
      if (group.includeUnknownAge) {
        selectedAges.push("UNKNOWN");
      }
      if (selectedAges.length > 0 && selectedAges.length < ageBuckets.length + 1) {
        selectedAges.forEach((age) => {
          operations.push({ label: groupLabel, detail: `年龄 ${age}` });
        });
      }

      group.ads.forEach((ad, adIndex) => {
        const adLabel = `${groupLabel} / 广告 ${adIndex + 1}：${ad.name}`;
        splitMultiline(ad.logos).forEach((logo, logoIndex) => {
          operations.push({ label: adLabel, detail: `Logo ${logoIndex + 1}: ${logo}` });
        });
        splitLines(ad.videoLinks).forEach((video, videoIndex) => {
          operations.push({ label: adLabel, detail: `YouTube 视频 ${videoIndex + 1}: ${video}` });
        });
        if (ad.callToAction !== "AUTO") {
          operations.push({ label: adLabel, detail: `CTA ${ad.callToAction}` });
        }
        operations.push({
          label: adLabel,
          detail: [
            `落地页 ${ad.finalUrl}`,
            `商家名 ${ad.businessName}`,
            `标题 ${splitLines(ad.shortHeadlines).slice(0, 3).join(" / ")}`,
            `描述 ${splitLines(ad.descriptions).slice(0, 2).join(" / ")}`,
          ].join(" · "),
        });
      });
    });

    return operations[operationIndex] ?? null;
  }

  function renderGoogleAdsErrorDetails(result: ApiResult) {
    if (!result.error) {
      return null;
    }

    const googleErrors = extractGoogleAdsErrors(result.error);
    if (googleErrors.length === 0) {
      return null;
    }

    const failedCampaignId =
      result.data &&
      typeof result.data === "object" &&
      "failedCampaignId" in result.data &&
      typeof result.data.failedCampaignId === "string"
        ? result.data.failedCampaignId
        : "";
    const failedCampaign = campaigns.find((campaign) => campaign.id === failedCampaignId) ?? campaigns[0];

    const previewErrors = googleErrors.slice(0, 3);

    return (
      <div className="mt-3 space-y-3">
        <div className="rounded-lg border border-[var(--semantic-error)]/20 bg-[var(--canvas-soft)] px-3 py-2">
          <p className="text-xs font-semibold text-[var(--ink)]">
            共 {googleErrors.length} 个 Google Ads 错误，先展示关键定位；完整详情在下方滚动查看。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {previewErrors.map((googleError, index) => {
              const operation = failedCampaign
                ? operationLabelForCampaign(failedCampaign, googleError.operationIndex)
                : null;

              return (
                <span
                  key={`${googleError.path}-summary-${index}`}
                  className="max-w-full truncate rounded-full border border-[var(--semantic-error)]/20 bg-[var(--surface-card)] px-2.5 py-1 text-[11px] text-[var(--body)]"
                  title={[operation?.label, operation?.detail, googleError.code].filter(Boolean).join(" · ")}
                >
                  {googleError.operationIndex !== null ? `Op ${googleError.operationIndex}` : "错误"}
                  {operation ? ` · ${operation.label}` : null}
                </span>
              );
            })}
            {googleErrors.length > previewErrors.length ? (
              <span className="rounded-full border border-[var(--hairline)] bg-[var(--surface-card)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                +{googleErrors.length - previewErrors.length} 个
              </span>
            ) : null}
          </div>
        </div>

        <details className="rounded-lg border border-[var(--semantic-error)]/20 bg-[var(--surface-card)]" open={googleErrors.length <= 3}>
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[var(--ink)]">
            错误详情
          </summary>
          <div className="max-h-72 space-y-2 overflow-auto border-t border-[var(--hairline)] p-2 pr-2.5">
            {googleErrors.map((googleError, index) => {
          const operation = failedCampaign
            ? operationLabelForCampaign(failedCampaign, googleError.operationIndex)
            : null;

          return (
            <div key={`${googleError.path}-${index}`} className="rounded-lg border border-[var(--semantic-error)]/25 bg-[var(--canvas-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--ink)]">
                {googleError.operationIndex !== null ? `Operation ${googleError.operationIndex}` : "Google Ads 错误"}
                {operation ? ` · ${operation.label}` : null}
              </p>
              {operation?.detail ? (
                <p className="mt-1 text-xs leading-relaxed text-[var(--body)]">{operation.detail}</p>
              ) : null}
              <dl className="mt-2 grid gap-1 text-xs leading-relaxed text-[var(--body)]">
                {googleError.code ? (
                  <div>
                    <dt className="inline font-semibold text-[var(--ink)]">错误类型：</dt>
                    <dd className="inline">{googleError.code}</dd>
                  </div>
                ) : null}
                {googleError.path ? (
                  <div>
                    <dt className="inline font-semibold text-[var(--ink)]">字段路径：</dt>
                    <dd className="inline break-all">{googleError.path}</dd>
                  </div>
                ) : null}
                {googleError.trigger ? (
                  <div>
                    <dt className="inline font-semibold text-[var(--ink)]">触发值：</dt>
                    <dd className="inline break-all">{googleError.trigger}</dd>
                  </div>
                ) : null}
                {googleError.message ? (
                  <div>
                    <dt className="inline font-semibold text-[var(--ink)]">Google 原因：</dt>
                    <dd className="inline">{googleError.message}</dd>
                  </div>
                ) : null}
              </dl>
              {googleError.policyTopics.length > 0 ? (
                <div className="mt-2 rounded-md border border-[var(--hairline)] bg-[var(--surface-card)] p-2">
                  <p className="text-xs font-semibold text-[var(--ink)]">政策主题</p>
                  <ul className="mt-1 space-y-1 text-xs leading-relaxed text-[var(--body)]">
                    {googleError.policyTopics.map((topic, topicIndex) => (
                      <li key={`${topic.topic}-${topicIndex}`}>
                        {[topic.topic, topic.type].filter(Boolean).join(" · ") || "未命名政策主题"}
                        {topic.evidences.length ? `：${topic.evidences.join(" / ")}` : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
            })}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="ads-launch-stage space-y-5 py-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="normal-case tracking-normal">
            {syncState === "loading" ? "正在同步 Google Ads 账号..." : syncState === "success" ? `已同步 ${adAccounts.length} 个投放账号` : syncState === "loaded" ? `已加载 ${adAccounts.length} 个已同步账号` : syncState === "error" ? "同步失败" : "等待同步"}
          </Badge>
          {syncedAt ? <span className="text-xs text-[var(--muted)]">最近同步：{new Date(syncedAt).toLocaleString()}</span> : null}
          <span className="text-xs text-[var(--muted)]">{campaigns.length}/4 Campaigns · {totalAdGroups} AdGroups · {totalAds} Ads</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={syncState === "loading"} size="sm" type="button" variant="outline" onClick={() => void syncGoogleAccounts()}>重新同步</Button>
          <Button disabled={campaigns.length >= 4} size="sm" type="button" onClick={addCampaign}>
            <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            新增 Campaign
          </Button>
        </div>
      </div>
      {syncError ? <p className="rounded-2xl border border-[var(--semantic-error)]/30 bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--semantic-error)]">{syncError}</p> : null}

      {/* Campaign grid */}
      <div className="ads-campaign-grid animate-fade-up">
        {campaignSlots.map((campaign, slotIndex) =>
          campaign ? (
            <CampaignOverviewCard
              key={campaign.id}
              campaign={buildCampaignOverviewMeta(
                campaign,
                slotIndex,
                adAccounts,
                getResources(campaign.adAccountId)?.geoTargets.data,
                getResources(campaign.adAccountId)?.languageTargets.data,
              )}
              canRemove={campaigns.length > 1}
              onEdit={() => openCampaignDetail(campaign.id)}
              onEditGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
              onEditAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
              onPreview={() => setPreviewCampaignId(campaign.id)}
              onRemove={() => removeCampaign(campaign.id)}
            />
          ) : (
            <CampaignOverviewAddTile key={`empty-${slotIndex}`} onClick={addCampaign} />
          ),
        )}
      </div>

      {/* Action bar */}
      <div className="ads-action-bar sticky bottom-0 z-10 -mx-4 border-t border-[var(--hairline)] bg-[var(--canvas)]/90 px-4 py-4 backdrop-blur-xl lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">{campaigns.length} 个广告系列 · {totalAdGroups} 个广告组 · {totalAds} 条广告</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">提交后会创建草稿并直接推送 Google Ads API。</p>
          </div>
          <Button disabled={isSubmitting || !campaigns.some((c) => c.adAccountId)} size="lg" type="button" onClick={() => void submitDrafts()}>
            {isSubmitting ? "提交中..." : "创建并推送"}
            <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
        {result ? (
          <div className={`mt-3 rounded-xl border p-4 ${result.success ? "border-[var(--hairline)] bg-[var(--surface-strong)]" : "border-[var(--semantic-error)]/30 bg-[var(--surface-card)]"}`}>
            <div className="flex items-start gap-2">
              {result.success ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-[var(--semantic-error)]" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">{result.success ? "提交成功" : result.error?.code ?? "创建失败"}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{result.success ? "已直接提交到 Google Ads API。" : result.error?.message}</p>
                {!result.success ? renderGoogleAdsErrorDetails(result) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      {activeCampaign && shouldShowCampaignEditor ? (
        <HierarchyEditModal
          eyebrow="编辑广告系列"
          hierarchyTrail={[{ label: "广告系列", name: activeCampaign.campaignName }]}
          title={activeCampaign.campaignName}
          onClose={closeCampaignEditor}
        >
          <CampaignEditorForm
            campaign={activeCampaign}
            adAccounts={adAccounts}
            syncState={syncState}
            conversionGoals={getResources(activeCampaign.adAccountId)?.conversionGoals.data ?? []}
            conversionGoalState={getResources(activeCampaign.adAccountId)?.conversionGoals.status ?? "idle"}
            conversionGoalError={getResources(activeCampaign.adAccountId)?.conversionGoals.error ?? null}
            conversionGoalSyncedAt={getResources(activeCampaign.adAccountId)?.conversionGoals.syncedAt ?? null}
            geoTargets={getResources(activeCampaign.adAccountId)?.geoTargets.data ?? FALLBACK_GEO_TARGET_OPTIONS}
            languageTargets={getResources(activeCampaign.adAccountId)?.languageTargets.data ?? FALLBACK_LANGUAGE_OPTIONS}
            patchCampaign={patchCampaign}
            loadConversionGoals={() => getResources(activeCampaign.adAccountId)?.conversionGoals.reload()}
            addAdGroup={addAdGroup}
            openAdGroupEditor={openAdGroupEditor}
            openAdEditor={openAdEditor}
          />
        </HierarchyEditModal>
      ) : null}

      {activeCampaign && activeEditorGroup && editorFocus?.level === "adgroup" ? (
        <HierarchyEditModal
          eyebrow="编辑广告组"
          hierarchyTrail={[{ label: "广告系列", name: activeCampaign.campaignName }, { label: "广告组", name: activeEditorGroup.name }]}
          maxWidthClassName="max-w-6xl"
          title={activeEditorGroup.name}
          zIndexClassName="z-[60]"
          onBack={returnToCampaignEditor}
          onClose={closeFocusedEditor}
        >
          <AdGroupEditorForm
            campaign={activeCampaign}
            group={activeEditorGroup}
            geoTargets={getResources(activeCampaign.adAccountId)?.geoTargets.data ?? FALLBACK_GEO_TARGET_OPTIONS}
            geoTargetState={getResources(activeCampaign.adAccountId)?.geoTargets.status ?? "idle"}
            languageTargets={getResources(activeCampaign.adAccountId)?.languageTargets.data ?? FALLBACK_LANGUAGE_OPTIONS}
            languageTargetState={getResources(activeCampaign.adAccountId)?.languageTargets.status ?? "idle"}
            updateCampaignAdGroup={updateCampaignAdGroup}
            toggleAdGroupGender={toggleAdGroupGender}
            toggleAdGroupAgeRange={toggleAdGroupAgeRange}
            addAd={addAd}
            openAdGroupEditor={openAdGroupEditor}
            openAdEditor={openAdEditor}
          />
        </HierarchyEditModal>
      ) : null}

      {activeCampaign && activeEditorGroup && activeEditorAd && editorFocus?.level === "ad" ? (
        <HierarchyEditModal
          eyebrow="编辑广告"
          hierarchyTrail={[{ label: "广告系列", name: activeCampaign.campaignName }, { label: "广告组", name: activeEditorGroup.name }, { label: "广告", name: activeEditorAd.name }]}
          maxWidthClassName="max-w-6xl"
          title={activeEditorAd.name}
          zIndexClassName="z-[70]"
          onBack={() => setEditorFocus({ level: "adgroup", campaignId: activeCampaign.id, groupId: activeEditorGroup.id })}
          onClose={closeFocusedEditor}
        >
          <AdEditorForm
            campaign={activeCampaign}
            group={activeEditorGroup}
            ad={activeEditorAd}
            geoTargets={getResources(activeCampaign.adAccountId)?.geoTargets.data ?? FALLBACK_GEO_TARGET_OPTIONS}
            languageTargets={getResources(activeCampaign.adAccountId)?.languageTargets.data ?? FALLBACK_LANGUAGE_OPTIONS}
            updateCampaignAd={updateCampaignAd}
            addAd={addAd}
            openAdGroupEditor={openAdGroupEditor}
            openAdEditor={openAdEditor}
          />
        </HierarchyEditModal>
      ) : null}

      {previewCampaign ? (
        <HierarchyEditModal
          eyebrow="预览广告系列"
          hierarchyTrail={[{ label: "广告系列", name: previewCampaign.campaignName }]}
          title={previewCampaign.campaignName}
          onClose={() => setPreviewCampaignId(null)}
        >
          {renderCampaignPreview(previewCampaign)}
        </HierarchyEditModal>
      ) : null}
    </div>
  );
}
