"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Layers3,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
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
  buildPresetPayloadFromCampaign,
  createDefaultAd,
  createDefaultAdGroup,
  applyPresetPayloadToCampaign,
  extractGoogleAdsErrors,
  formatSchedule,
  formatStableDateTime,
  notificationMessageFromResult,
  splitLines,
  splitMultiline,
  successMessageFromResult,
  summarizeOsDevice,
  summarizeDevicesSelection,
  summarizeOsSelection,
  validateAd,
  validateAdGroup,
  validateCampaign,
  hasErrors,
  type AdErrors,
  type AdGroupErrors,
  type CampaignErrors,
  AD_ERROR_LABELS,
  AG_ERROR_LABELS,
  CAMPAIGN_ERROR_LABELS,
  errorFields,
} from "@/components/ads/campaign-hierarchy/form-utils";
import { CampaignEditorForm } from "@/components/ads/campaign-hierarchy/campaign-editor-form";
import { AdGroupEditorForm } from "@/components/ads/campaign-hierarchy/adgroup-editor-form";
import { AdEditorForm } from "@/components/ads/campaign-hierarchy/ad-editor-form";
import { CampaignPresetEditorForm } from "@/components/ads/campaign-hierarchy/campaign-preset-editor-form";
import { useAccountResources } from "@/hooks/useAccountResource";
import type {
  AdForm,
  AdGroupForm,
  ApiResult,
  CampaignForm,
  EditorFocus,
} from "@/components/ads/campaign-hierarchy/types";
import type {
  CampaignPreset,
  CampaignPresetPayload,
  GoogleAdAccount,
  GoogleMccAccount,
  LaunchBatch,
} from "@/lib/types";
import type { CampaignHierarchyEditorProps } from "@/components/ads/campaign-hierarchy/types";

const MAX_RESOURCE_ACCOUNTS = 4;

type PresetTableRow = {
  bidding: string;
  budget: string;
  id: string;
  name: string;
  scheduleTags: string[];
  deviceTags: string[];
  trackingTags: string[];
  updatedAt: string;
  description?: string;
  objective: string;
};

function clonePresetPayload(payload: CampaignPresetPayload): CampaignPresetPayload {
  return {
    ...payload,
    os: [...payload.os],
    devices: [...payload.devices],
    adSchedule: Object.fromEntries(
      Object.entries(payload.adSchedule).map(([day, hours]) => [day, [...hours]]),
    ),
    adGroups: payload.adGroups.map((group) => ({
      ...group,
      genders: [...group.genders],
      ageRanges: [...group.ageRanges],
      ads: group.ads.map((ad) => ({ ...ad })),
    })),
  };
}

function defaultPresetPayload(): CampaignPresetPayload {
  return buildPresetPayloadFromCampaign(buildDefaultCampaign(1));
}

function buildDeviceTags(os: string[], devices: string[]) {
  return [summarizeOsSelection(os), summarizeDevicesSelection(devices)];
}

function buildScheduleTags(schedule: CampaignPresetPayload["adSchedule"]) {
  const formatted = formatSchedule(schedule);
  if (!formatted || formatted === "未设置") {
    return ["未设置"];
  }

  if (formatted === "每天 00:00-24:00") {
    return ["全天投放"];
  }

  const segments = formatted
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const firstRange = segments[0]?.split("：")[1]?.trim();

  return [segments.length > 0 ? `${segments.length}天投放` : "已设置", firstRange || "分时投放"];
}

function buildTrackingTags(payload: CampaignPresetPayload) {
  const tags = [];
  if (payload.finalUrlSuffix) {
    tags.push(`Suffix 已设置`);
  } else {
    tags.push("Suffix 未设");
  }
  tags.push(`IP 排除 ${splitLines(payload.ipExclusions).length || 0} 条`);
  return tags;
}

export function CampaignHierarchyEditor({
  initialAdAccounts,
  accountSyncError: initialSyncError = null,
  accountsSyncedAt: initialSyncedAt = null,
  initialMccAccounts = [],
  initialPresets = [],
  initialLaunchBatches = [],
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
  const [presets, setPresets] = useState<CampaignPreset[]>(initialPresets);
  const [launchBatches, setLaunchBatches] = useState<LaunchBatch[]>(initialLaunchBatches);
  const [presetDialog, setPresetDialog] = useState<null | "apply" | "manage">(null);
  const [presetEditor, setPresetEditor] = useState<null | {
    description: string;
    id?: string;
    mode: "create" | "edit";
    name: string;
    payload: CampaignPresetPayload;
  }>(null);
  const idCounterRef = useRef(2);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [isCampaignEditorOpen, setIsCampaignEditorOpen] = useState(false);
  const [editorFocus, setEditorFocus] = useState<EditorFocus | null>(null);
  const [previewCampaignId, setPreviewCampaignId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"campaigns" | "tasks">("campaigns");
  const [campaignErrors, setCampaignErrors] = useState<Record<string, CampaignErrors>>({});
  const [adGroupErrors, setAdGroupErrors] = useState<Record<string, AdGroupErrors>>({});
  const [adErrors, setAdErrors] = useState<Record<string, AdErrors>>({});

  function validateAllDrafts(): boolean {
    const campErrors: Record<string, CampaignErrors> = {};
    const groupErrors: Record<string, AdGroupErrors> = {};
    const adErrs: Record<string, AdErrors> = {};
    let valid = true;

    for (const campaign of campaigns) {
      const ce = validateCampaign(campaign);
      if (hasErrors(ce)) { campErrors[campaign.id] = ce; valid = false; }

      for (const group of campaign.adGroups) {
        const ge = validateAdGroup(group);
        if (hasErrors(ge)) { groupErrors[`${campaign.id}:${group.id}`] = ge; valid = false; }

        for (const ad of group.ads) {
          const ae = validateAd(ad);
          if (hasErrors(ae)) { adErrs[`${campaign.id}:${group.id}:${ad.id}`] = ae; valid = false; }
        }
      }
    }

    setCampaignErrors(campErrors);
    setAdGroupErrors(groupErrors);
    setAdErrors(adErrs);

    if (!valid) {
      // Build detailed toast message
      const lines: string[] = [];

      for (const campaign of campaigns) {
        const ce = campErrors[campaign.id];
        if (ce) {
          const fields = errorFields(ce, CAMPAIGN_ERROR_LABELS);
          if (fields.length) lines.push(`${campaign.campaignName}：${fields.join("、")}未填`);
        }

        for (const group of campaign.adGroups) {
          const ge = groupErrors[`${campaign.id}:${group.id}`];
          if (ge) {
            const fields = errorFields(ge, AG_ERROR_LABELS);
            if (fields.length) lines.push(`${group.name}：${fields.join("、")}未填`);
          }

          for (const ad of group.ads) {
            const ae = adErrs[`${campaign.id}:${group.id}:${ad.id}`];
            if (ae) {
              const fields = errorFields(ae, AD_ERROR_LABELS);
              if (fields.length) lines.push(`${ad.name}：${fields.join("、")}未填`);
            }
          }
        }
      }

      notify({
        tone: "error",
        title: "表单校验未通过",
        description: lines.length ? lines.join("\n") : "请检查所有必填项后再提交。",
      });

      // Expand first campaign with errors
      const firstCampaignId = Object.keys(campErrors)[0];
      if (firstCampaignId) {
        setActiveCampaignId(firstCampaignId);
        setIsCampaignEditorOpen(true);
        setEditorFocus(null);
      }
    }

    return valid;
  }

  // Unique account IDs present in campaigns — max 4
  const accountIdsKey = useMemo(
    () =>
      [...new Set(campaigns.map((c) => c.adAccountId).filter(Boolean))]
        .sort()
        .join(","),
    [campaigns],
  );

  // Derive up to MAX_RESOURCE_ACCOUNTS unique account IDs for reference-data hooks.
  const accountIds = useMemo(() => {
    const ids = accountIdsKey ? accountIdsKey.split(",") : [];
    return ids.slice(0, MAX_RESOURCE_ACCOUNTS);
  }, [accountIdsKey]);

  // Always call all 4 hooks unconditionally to satisfy React rules-of-hooks.
  // useAccountResources handles empty adAccountId internally with fallback data.
  const resources0 = useAccountResources(accountIds[0] ?? "", adAccounts, mccAccounts);
  const resources1 = useAccountResources(accountIds[1] ?? "", adAccounts, mccAccounts);
  const resources2 = useAccountResources(accountIds[2] ?? "", adAccounts, mccAccounts);
  const resources3 = useAccountResources(accountIds[3] ?? "", adAccounts, mccAccounts);

  const allResources = useMemo(() => {
    const map: Record<string, ReturnType<typeof useAccountResources>> = {};
    if (accountIds[0]) map[accountIds[0]] = resources0;
    if (accountIds[1]) map[accountIds[1]] = resources1;
    if (accountIds[2]) map[accountIds[2]] = resources2;
    if (accountIds[3]) map[accountIds[3]] = resources3;
    return map;
  }, [accountIds, resources0, resources1, resources2, resources3]);

  const hasRunningBatches = useMemo(
    () => launchBatches.some((batch) => ["QUEUED", "RUNNING"].includes(batch.status)),
    [launchBatches],
  );

  const reloadPresets = useCallback(async () => {
    const response = await fetch("/api/campaign-presets");
    const json = (await response.json()) as ApiResult;
    if (json.success && Array.isArray(json.data)) {
      setPresets(json.data as CampaignPreset[]);
    }
  }, []);

  const reloadLaunchBatches = useCallback(async () => {
    const response = await fetch("/api/launch-batches");
    const json = (await response.json()) as ApiResult;
    if (json.success && Array.isArray(json.data)) {
      setLaunchBatches(json.data as LaunchBatch[]);
    }
  }, []);

  useEffect(() => {
    if (!hasRunningBatches) {
      return;
    }
    const interval = window.setInterval(() => {
      void reloadLaunchBatches();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [hasRunningBatches, reloadLaunchBatches]);

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
    // Clear campaign validation errors on edit
    setCampaignErrors((prev) => {
      if (!prev[campaignId]) return prev;
      const next = { ...prev };
      delete next[campaignId];
      return next;
    });
  }

  function updateCampaignAdGroup(campaignId: string, groupId: string, patch: Partial<AdGroupForm>) {
    setCampaigns((current) =>
      current.map((c) =>
        c.id === campaignId
          ? { ...c, adGroups: c.adGroups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) }
          : c,
      ),
    );
    // Clear adgroup validation errors on edit
    setAdGroupErrors((prev) => {
      const key = `${campaignId}:${groupId}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
    // Clear ad validation errors on edit
    setAdErrors((prev) => {
      const key = `${campaignId}:${groupId}:${adId}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
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

  function duplicateCampaign(campaignId: string) {
    const source = campaigns.find((c) => c.id === campaignId);
    if (!source) return;

    const nextIndex = campaigns.length + 1;
    const nextCampaignId = `cmp_${nextIndex}_${idCounterRef.current++}`;
    const nextCampaign: CampaignForm = {
      ...source,
      id: nextCampaignId,
      campaignName: `${source.campaignName} 复制`,
      adGroups: source.adGroups.map((group, groupIndex) => {
        const nextGroupId = `adg_${groupIndex + 1}_${idCounterRef.current++}`;
        return {
          ...group,
          id: nextGroupId,
          name: `${group.name} 复制`,
          genders: [...group.genders],
          ageRanges: [...group.ageRanges],
          ads: group.ads.map((ad, adIndex) => ({
            ...ad,
            id: `${nextGroupId}_ad_${adIndex + 1}_${idCounterRef.current++}`,
            name: `${ad.name} 复制`,
          })),
        };
      }),
      os: [...source.os],
      devices: [...source.devices],
      adSchedule: Object.fromEntries(
        Object.entries(source.adSchedule).map(([day, values]) => [day, [...values]]),
      ),
    };

    setCampaigns((current) => {
      const sourceIndex = current.findIndex((campaign) => campaign.id === campaignId);
      if (sourceIndex === -1) return current;
      return [
        ...current.slice(0, sourceIndex + 1),
        nextCampaign,
        ...current.slice(sourceIndex + 1),
      ];
    });
    setActiveCampaignId(nextCampaignId);
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

  function duplicateAdGroup(campaignId: string, groupId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    const group = campaign?.adGroups.find((g) => g.id === groupId);
    if (!campaign || !group) return;

    const nextGroupId = `adg_${campaign.adGroups.length + 1}_${idCounterRef.current++}`;
    const nextGroup: AdGroupForm = {
      ...group,
      id: nextGroupId,
      name: `${group.name} 复制`,
      genders: [...group.genders],
      ageRanges: [...group.ageRanges],
      ads: group.ads.map((ad, adIndex) => ({
        ...ad,
        id: `${nextGroupId}_ad_${adIndex + 1}_${idCounterRef.current++}`,
        name: `${ad.name} 复制`,
      })),
    };
    const groupIndex = campaign.adGroups.findIndex((item) => item.id === groupId);
    const nextGroups = [
      ...campaign.adGroups.slice(0, groupIndex + 1),
      nextGroup,
      ...campaign.adGroups.slice(groupIndex + 1),
    ];

    patchCampaign(campaignId, { adGroups: nextGroups });
    setActiveCampaignId(campaignId);
    setIsCampaignEditorOpen(false);
    setEditorFocus({ level: "adgroup", campaignId, groupId: nextGroupId });
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

  function duplicateAd(campaignId: string, groupId: string, adId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    const group = campaign?.adGroups.find((g) => g.id === groupId);
    const ad = group?.ads.find((item) => item.id === adId);
    if (!group || !ad) return;

    const nextAdId = `${groupId}_ad_${group.ads.length + 1}_${idCounterRef.current++}`;
    const nextAd: AdForm = {
      ...ad,
      id: nextAdId,
      name: `${ad.name} 复制`,
    };
    const adIndex = group.ads.findIndex((item) => item.id === adId);
    const nextAds = [
      ...group.ads.slice(0, adIndex + 1),
      nextAd,
      ...group.ads.slice(adIndex + 1),
    ];

    updateCampaignAdGroup(campaignId, groupId, { ads: nextAds });
    setActiveCampaignId(campaignId);
    setIsCampaignEditorOpen(false);
    setEditorFocus({ level: "ad", campaignId, groupId, adId: nextAdId });
  }

  function removeAd(campaignId: string, groupId: string, adId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    const group = campaign?.adGroups.find((g) => g.id === groupId);
    if (!group || group.ads.length === 1) return;
    updateCampaignAdGroup(campaignId, groupId, { ads: group.ads.filter((a) => a.id !== adId) });
    clearEditorFocusForAd(campaignId, groupId, adId);
  }

  function nextPresetElementId() {
    return String(idCounterRef.current++);
  }

  function openPresetManager() {
    setPresetDialog("manage");
  }

  function closePresetManager() {
    setPresetDialog(null);
    setPresetEditor(null);
  }

  function openPresetCreateEditor() {
    setPresetEditor({
      mode: "create",
      name: "新预设",
      description: "",
      payload: defaultPresetPayload(),
    });
  }

  const openPresetEditEditor = useCallback((preset: CampaignPreset) => {
    setPresetEditor({
      id: preset.id,
      mode: "edit",
      name: preset.name,
      description: preset.description ?? "",
      payload: clonePresetPayload(preset.payload),
    });
  }, []);

  function applyPresetToCampaign(preset: CampaignPreset, campaignId = activeCampaignId ?? campaigns[0]?.id) {
    if (!campaignId) return;
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId
          ? applyPresetPayloadToCampaign(campaign, preset.payload, nextPresetElementId)
          : campaign,
      ),
    );
    setPresetDialog(null);
    notify({
      tone: "success",
      title: "已套用预设",
      description: `已套用「${preset.name}」，账号、Campaign 名称、广告 URL 与视频链接已保留。`,
    });
  }

  async function savePresetEditor() {
    if (!presetEditor?.name.trim()) {
      notify({ tone: "error", title: "无法保存预设", description: "请输入预设名称。" });
      return;
    }

    const isEditing = presetEditor.mode === "edit" && presetEditor.id;
    const response = await fetch(
      isEditing ? `/api/campaign-presets/${presetEditor.id}` : "/api/campaign-presets",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetEditor.name.trim(),
          description: presetEditor.description.trim(),
          payload: presetEditor.payload,
        }),
      },
    );
    const json = (await response.json()) as ApiResult;
    if (!json.success) {
      notify({ tone: "error", title: json.error?.code ?? "预设保存失败", description: json.error?.message ?? "请稍后重试。" });
      return;
    }

    await reloadPresets();
    notify({
      tone: "success",
      title: isEditing ? "预设已更新" : "预设已创建",
      description: `「${presetEditor.name.trim()}」已保存。`,
    });
    setPresetEditor(null);
  }

  const deletePreset = useCallback(async (presetId: string) => {
    const response = await fetch(`/api/campaign-presets/${presetId}`, { method: "DELETE" });
    const json = (await response.json()) as ApiResult;
    if (!json.success) {
      notify({ tone: "error", title: json.error?.code ?? "预设删除失败", description: json.error?.message ?? "请稍后重试。" });
      return;
    }

    await reloadPresets();
    notify({ tone: "success", title: "预设已删除" });
  }, [notify, reloadPresets]);

  const presetTableRows = useMemo<PresetTableRow[]>(
    () =>
      presets.map((preset) => {
        const bidding =
          preset.payload.campaignObjective === "CONVERSIONS"
            ? preset.payload.biddingType === "TARGET_CPA"
              ? `目标 CPA ${preset.payload.targetCpa || "未填写"}`
              : "尽可能提高转化"
            : preset.payload.clickBiddingType === "MAX_CPC"
              ? `目标 CPC ${preset.payload.targetCpc || "未填写"}`
              : "尽可能提高点击";

        return {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          objective: preset.payload.campaignObjective,
          bidding,
          budget: preset.payload.budgetDaily || "未填写",
          deviceTags: buildDeviceTags(preset.payload.os, preset.payload.devices),
          scheduleTags: buildScheduleTags(preset.payload.adSchedule),
          trackingTags: buildTrackingTags(preset.payload),
          updatedAt: formatStableDateTime(preset.updatedAt),
        };
      }),
    [presets],
  );

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
    // Validate all drafts before submitting (toast shown inside validateAllDrafts)
    if (!validateAllDrafts()) {
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      const firstAdFallback = createDefaultAd(1);
      const response = await fetch("/api/launch-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaigns: campaigns.map((campaign) => ({
            clientCampaignId: campaign.id,
            campaignName: campaign.campaignName,
            payload: buildPayloadFromCampaign(campaign, firstAdFallback),
          })),
        }),
      });
      const json = (await response.json()) as ApiResult;
      if (!json.success) {
        notify({ tone: "error", title: json.error?.code ?? "提交失败", description: notificationMessageFromResult(json) });
        setResult(json);
        return;
      }

      if (json.data && typeof json.data === "object" && "id" in json.data) {
        setLaunchBatches((current) => [json.data as LaunchBatch, ...current]);
      }
      const successResult = { success: true as const, data: { message: `已提交 ${campaigns.length} 个广告系列，后台正在创建。` } };
      notify({ tone: "success", title: "已进入后台创建", description: successMessageFromResult(successResult, `已提交 ${campaigns.length} 个广告系列，后台正在创建。`) });
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

  // Derive per-campaign error maps for the sidebar
  const activeCampaignGroupErrors = useMemo(() => {
    if (!activeCampaign) return {};
    const result: Record<string, AdGroupErrors> = {};
    for (const [key, errs] of Object.entries(adGroupErrors)) {
      if (key.startsWith(`${activeCampaign.id}:`)) {
        result[key.slice(activeCampaign.id.length + 1)] = errs;
      }
    }
    return result;
  }, [activeCampaign, adGroupErrors]);

  const activeCampaignAdErrors = useMemo(() => {
    if (!activeCampaign) return {};
    const result: Record<string, AdErrors> = {};
    for (const [key, errs] of Object.entries(adErrors)) {
      if (key.startsWith(`${activeCampaign.id}:`)) {
        result[key.slice(activeCampaign.id.length + 1)] = errs;
      }
    }
    return result;
  }, [activeCampaign, adErrors]);

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

    const scheduleDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    const deviceTypes = ["DESKTOP", "MOBILE", "TABLET", "CONNECTED_TV"];
    const scheduleRanges = scheduleDays.flatMap((day) => {
      const ranges: Array<{ day: string; start: number; end: number }> = [];
      const hours = campaign.adSchedule[day] ?? [];
      let start: number | null = null;
      for (let hour = 0; hour <= 24; hour += 1) {
        const enabled = hour < 24 ? hours[hour] === true : false;
        if (enabled && start === null) {
          start = hour;
        }
        if (!enabled && start !== null) {
          ranges.push({ day, start, end: hour });
          start = null;
        }
      }
      return ranges;
    });
    const hasFullSchedule =
      scheduleRanges.length === 7 &&
      scheduleRanges.every((range) => range.start === 0 && range.end === 24);
    const selectedDevices = new Set(campaign.devices.filter((device) => deviceTypes.includes(device)));
    const excludedDevices =
      selectedDevices.size > 0 && selectedDevices.size < deviceTypes.length
        ? deviceTypes.filter((device) => !selectedDevices.has(device))
        : [];
    const operatingSystemVersions = campaign.os.filter((os) =>
      os.startsWith("operatingSystemVersionConstants/"),
    );

    const operations: Array<{ label: string; detail?: string }> = [
      { label: "广告系列预算", detail: campaign.budgetDaily },
      { label: "广告系列", detail: campaign.campaignName },
    ];
    if (!hasFullSchedule) {
      scheduleRanges.forEach((range) => {
        operations.push({
          label: "广告投放时间",
          detail: `${range.day} ${String(range.start).padStart(2, "0")}:00-${String(range.end).padStart(2, "0")}:00`,
        });
      });
    }
    excludedDevices.forEach((device) => {
      operations.push({ label: "设备排除", detail: device });
    });
    operatingSystemVersions.forEach((os) => {
      operations.push({ label: "操作系统定向", detail: os });
    });
    splitLines(campaign.ipExclusions).forEach((ip) => {
      operations.push({ label: "IP 排除", detail: ip });
    });

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

      const audienceDetails: string[] = [];
      const selectedGenders = Array.from(
        new Set(group.genders.filter((gender) => allGenders.includes(gender))),
      );
      if (selectedGenders.length > 0 && selectedGenders.length < allGenders.length) {
        audienceDetails.push(`性别 ${selectedGenders.join(" / ")}`);
      }

      const selectedAges = Array.from(
        new Set(group.ageRanges.filter((age) => ageBuckets.includes(age))),
      );
      if (group.includeUnknownAge) {
        selectedAges.push("UNKNOWN");
      }
      if (selectedAges.length > 0 && selectedAges.length < ageBuckets.length + 1) {
        audienceDetails.push(`年龄 ${selectedAges.join(" / ")}`);
      }
      if (audienceDetails.length > 0) {
        operations.push({ label: groupLabel, detail: `受众配置 ${audienceDetails.join(" · ")}` });
        operations.push({ label: groupLabel, detail: "绑定受众配置" });
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
              <Badge className="normal-case tracking-normal">
                +{googleErrors.length - previewErrors.length} 个
              </Badge>
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

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      QUEUED: "排队中",
      RUNNING: "创建中",
      SUCCEEDED: "成功",
      PARTIAL_FAILED: "部分失败",
      FAILED: "失败",
    };
    return labels[status] ?? status;
  }

  function renderLaunchBatches() {
    return (
      <section className="rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-caption-uppercase text-[var(--muted)]">Launch Jobs</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">创建任务</h2>
          </div>
          <Button size="sm" type="button" variant="outline" onClick={() => void reloadLaunchBatches()}>
            <RefreshCw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            刷新
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {launchBatches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-5 text-sm text-[var(--muted)]">
              还没有后台创建任务。
            </p>
          ) : launchBatches.slice(0, 5).map((batch) => (
            <div key={batch.id} className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{batch.id}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{formatStableDateTime(batch.createdAt)}</p>
                </div>
                <Badge className="normal-case tracking-normal">{statusLabel(batch.status)}</Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {batch.items.map((item) => {
                  const campaign = campaigns.find((candidate) => candidate.id === item.clientCampaignId);
                  const googleErrors = extractGoogleAdsErrors(item.error);
                  return (
                    <div key={item.id} className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--ink)]">{item.campaignName}</p>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">Draft {item.draftId} · Job {item.jobId}</p>
                        </div>
                        <Badge className="normal-case tracking-normal">{statusLabel(item.status)}</Badge>
                      </div>
                      {item.result?.campaignResourceName ? (
                        <p className="mt-2 break-all text-xs text-[var(--semantic-success)]">{item.result.campaignResourceName}</p>
                      ) : null}
                      {item.error ? (
                        <div className="mt-2 rounded-lg border border-[var(--semantic-error)]/25 bg-[var(--canvas-soft)] p-2 text-xs leading-relaxed text-[var(--body)]">
                          <p className="font-semibold text-[var(--semantic-error)]">{item.error.message}</p>
                          {googleErrors.slice(0, 3).map((googleError, index) => {
                            const operation = campaign ? operationLabelForCampaign(campaign, googleError.operationIndex) : null;
                            return (
                              <p key={`${item.id}-err-${index}`} className="mt-1">
                                {[googleError.code, operation?.label, googleError.trigger, googleError.message].filter(Boolean).join(" · ")}
                              </p>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderPresetDialog() {
    if (!presetDialog || presetDialog === "manage") return null;

    return (
      <HierarchyEditModal
        eyebrow="投放预设"
        maxWidthClassName="max-w-4xl"
        title="选择预设"
        onClose={() => setPresetDialog(null)}
      >
        <div className="grid gap-3">
          {presets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-6 text-sm text-[var(--muted)]">暂无预设。</p>
          ) : presets.map((preset) => (
            <div key={preset.id} className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[var(--ink)]">{preset.name}</p>
                  {preset.description ? <p className="mt-1 text-sm text-[var(--muted)]">{preset.description}</p> : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {preset.payload.campaignObjective} · {summarizeOsDevice(preset.payload.os, preset.payload.devices)} · 更新于 {formatStableDateTime(preset.updatedAt)}
                  </p>
                </div>
                <Button size="sm" type="button" onClick={() => applyPresetToCampaign(preset)}>
                  套用
                </Button>
              </div>
            </div>
          ))}
        </div>
      </HierarchyEditModal>
    );
  }

  function renderPresetManager() {
    return (
      <Drawer
        eyebrow="投放预设"
        open={presetDialog === "manage"}
        title={presetEditor ? (presetEditor.mode === "create" ? "添加预设" : "编辑预设") : "管理预设"}
        widthClassName="w-[80vw] sm:max-w-none"
        zIndexClassName="z-[80]"
        onClose={closePresetManager}
      >
        {presetEditor ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-6 py-4">
              <Button size="sm" type="button" variant="outline" onClick={() => setPresetEditor(null)}>
                返回列表
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" type="button" variant="outline" onClick={() => setPresetEditor(null)}>
                  取消
                </Button>
                <Button size="sm" type="button" onClick={() => void savePresetEditor()}>
                  <Save aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  保存预设
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
              <CampaignPresetEditorForm
                conversionGoals={resources0.conversionGoals.data}
                conversionGoalError={resources0.conversionGoals.error}
                conversionGoalState={resources0.conversionGoals.status}
                conversionGoalSyncedAt={resources0.conversionGoals.syncedAt}
                description={presetEditor.description}
                loadConversionGoals={() => resources0.conversionGoals.reload()}
                name={presetEditor.name}
                payload={presetEditor.payload}
                onDescriptionChange={(description) =>
                  setPresetEditor((current) => current ? { ...current, description } : current)
                }
                onNameChange={(name) =>
                  setPresetEditor((current) => current ? { ...current, name } : current)
                }
                onPayloadChange={(payload) =>
                  setPresetEditor((current) => current ? { ...current, payload } : current)
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--ink)]">
                {presets.length} 套预设
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" type="button" variant="outline" onClick={() => void reloadPresets()}>
                刷新列表
              </Button>
              <Button size="sm" type="button" onClick={openPresetCreateEditor}>
                <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                添加预设
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
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
              <div className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--hairline)] bg-[var(--canvas-soft)] hover:bg-[var(--canvas-soft)]">
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">预设名称</TableHead>
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">目标 / 出价</TableHead>
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">预算</TableHead>
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">设备</TableHead>
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">投放时间</TableHead>
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">跟踪配置</TableHead>
                      <TableHead className="py-3.5 font-semibold text-[var(--ink)]">最近更新</TableHead>
                      <TableHead className="py-3.5 text-right font-semibold text-[var(--ink)]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presetTableRows.map((row) => {
                      const preset = presets.find((item) => item.id === row.id);
                      return (
                        <TableRow key={row.id} className="border-b border-[var(--hairline)] transition-colors hover:bg-[var(--canvas-soft)]/60">
                          <TableCell className="py-3.5">
                            <div className="min-w-0 max-w-[280px]">
                              <p className="truncate text-sm font-semibold text-[var(--ink)]">{row.name}</p>
                              {row.description ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                                  {row.description}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex flex-col gap-1.5">
                              <Tag className="w-fit" tone="neutral">{row.objective}</Tag>
                              <span className="text-xs text-[var(--muted)]">{row.bidding}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Tag className="w-fit" tone="green">{row.budget}</Tag>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex max-w-[160px] flex-wrap gap-1.5">
                              {row.deviceTags.map((tag) => (
                                <Tag key={tag} className="max-w-full truncate" tone="blue">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex max-w-[160px] flex-wrap gap-1.5">
                              {row.scheduleTags.map((tag) => (
                                <Tag key={tag} className="max-w-full truncate" tone="amber">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex max-w-[160px] flex-wrap gap-1.5">
                              {row.trackingTags.map((tag) => (
                                <Tag key={tag} className="max-w-full truncate" tone="rose">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 text-xs text-[var(--muted)]">
                            {row.updatedAt}
                          </TableCell>
                          <TableCell className="py-3.5">
                            {preset ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" type="button" variant="outline" onClick={() => openPresetEditEditor(preset)}>
                                  编辑
                                </Button>
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                  className="text-[var(--semantic-error)] hover:bg-[var(--semantic-error)]/8 hover:text-[var(--semantic-error)]"
                                  onClick={() => void deletePreset(preset.id)}
                                >
                                  删除
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        )}
      </Drawer>
    );
  }

  return (
    <div className="ads-launch-stage space-y-5 py-5">
      <Tabs
        aria-label="投放工作区"
        value={activeWorkspaceTab}
        onValueChange={(v) => setActiveWorkspaceTab(v as "campaigns" | "tasks")}
      >
        {/* Header bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] px-4 py-3 shadow-[var(--shadow-soft)]">
          <div className="min-w-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="normal-case tracking-normal">
                {syncState === "loading" ? "正在同步 Google Ads 账号..." : syncState === "success" ? `已同步 ${adAccounts.length} 个投放账号` : syncState === "loaded" ? `已加载 ${adAccounts.length} 个已同步账号` : syncState === "error" ? "同步失败" : "等待同步"}
              </Badge>
              {syncedAt ? <span className="text-xs text-[var(--muted)]">最近同步：{formatStableDateTime(syncedAt)}</span> : null}
              <span className="text-xs text-[var(--muted)]">{campaigns.length} Campaigns · {totalAdGroups} AdGroups · {totalAds} Ads</span>
            </div>
            <TabsList className="w-fit">
              <TabsTrigger value="campaigns">Campaign 列表</TabsTrigger>
              <TabsTrigger value="tasks">创建任务</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button disabled={syncState === "loading"} size="sm" type="button" variant="outline" onClick={() => void syncGoogleAccounts()}>重新同步</Button>
            <Button size="sm" type="button" variant="outline" onClick={openPresetManager}>
              管理预设
            </Button>
            <Button size="sm" type="button" onClick={addCampaign}>
              <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              新增 Campaign
            </Button>
            <Button disabled={isSubmitting || !campaigns.some((c) => c.adAccountId)} size="sm" type="button" onClick={() => void submitDrafts()}>
              {isSubmitting ? "提交中..." : "提交后台创建"}
              <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
        {syncError ? <p className="rounded-2xl border border-[var(--semantic-error)]/30 bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--semantic-error)]">{syncError}</p> : null}
        {result && !result.success ? (
          <div className="rounded-2xl border border-[var(--semantic-error)]/30 bg-[var(--surface-card)] p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-[var(--semantic-error)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">{result.error?.code ?? "提交失败"}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{result.error?.message}</p>
                {renderGoogleAdsErrorDetails(result)}
              </div>
            </div>
          </div>
        ) : null}

        <TabsContent className="mt-5" value="campaigns">
          <div className="ads-campaign-grid animate-fade-up">
            {campaigns.map((campaign, slotIndex) => (
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
              canDuplicate
              onDuplicate={() => duplicateCampaign(campaign.id)}
              onEdit={() => openCampaignDetail(campaign.id)}
              onEditGroup={(groupId) => openAdGroupEditor(campaign.id, groupId)}
              onEditAd={(groupId, adId) => openAdEditor(campaign.id, groupId, adId)}
              onPreview={() => setPreviewCampaignId(campaign.id)}
              onRemove={() => removeCampaign(campaign.id)}
            />
          ))}
          <CampaignOverviewAddTile onClick={addCampaign} />
        </div>
        </TabsContent>
        <TabsContent className="mt-5" value="tasks">
          {renderLaunchBatches()}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {activeCampaign && shouldShowCampaignEditor ? (
        <HierarchyEditModal
          eyebrow="编辑广告系列"
          hierarchyTrail={[{ label: "广告系列", name: activeCampaign.campaignName }]}
          title={activeCampaign.campaignName}
          onClose={closeCampaignEditor}
        >
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button disabled={presets.length === 0} size="sm" type="button" variant="outline" onClick={() => setPresetDialog("apply")}>
              <Layers3 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              套用预设
            </Button>
          </div>
          <CampaignEditorForm
            campaign={activeCampaign}
            adAccounts={adAccounts}
            syncState={syncState}
            errors={campaignErrors[activeCampaign.id]}
            groupErrors={activeCampaignGroupErrors}
            adErrors={activeCampaignAdErrors}
            conversionGoals={getResources(activeCampaign.adAccountId)?.conversionGoals.data ?? []}
            conversionGoalState={getResources(activeCampaign.adAccountId)?.conversionGoals.status ?? "idle"}
            conversionGoalError={getResources(activeCampaign.adAccountId)?.conversionGoals.error ?? null}
            conversionGoalSyncedAt={getResources(activeCampaign.adAccountId)?.conversionGoals.syncedAt ?? null}
            geoTargets={getResources(activeCampaign.adAccountId)?.geoTargets.data ?? FALLBACK_GEO_TARGET_OPTIONS}
            languageTargets={getResources(activeCampaign.adAccountId)?.languageTargets.data ?? FALLBACK_LANGUAGE_OPTIONS}
            patchCampaign={patchCampaign}
            loadConversionGoals={() => getResources(activeCampaign.adAccountId)?.conversionGoals.reload()}
            addAdGroup={addAdGroup}
            duplicateAdGroup={duplicateAdGroup}
            duplicateAd={duplicateAd}
            removeAdGroup={removeAdGroup}
            removeAd={removeAd}
            openAdGroupEditor={openAdGroupEditor}
            openAdEditor={openAdEditor}
          />
        </HierarchyEditModal>
      ) : null}

      {activeCampaign && activeEditorGroup && editorFocus?.level === "adgroup" ? (
        <HierarchyEditModal
          eyebrow="编辑广告组"
          hierarchyTrail={[
            { label: "广告系列", name: activeCampaign.campaignName, onClick: returnToCampaignEditor },
            { label: "广告组", name: activeEditorGroup.name },
          ]}
          maxWidthClassName="max-w-6xl"
          title={activeEditorGroup.name}
          zIndexClassName="z-[60]"
          onBack={returnToCampaignEditor}
          onClose={closeFocusedEditor}
        >
          <AdGroupEditorForm
            campaign={activeCampaign}
            group={activeEditorGroup}
            errors={adGroupErrors[`${activeCampaign.id}:${activeEditorGroup.id}`]}
            groupErrors={activeCampaignGroupErrors}
            adErrors={activeCampaignAdErrors}
            geoTargets={getResources(activeCampaign.adAccountId)?.geoTargets.data ?? FALLBACK_GEO_TARGET_OPTIONS}
            geoTargetState={getResources(activeCampaign.adAccountId)?.geoTargets.status ?? "idle"}
            languageTargets={getResources(activeCampaign.adAccountId)?.languageTargets.data ?? FALLBACK_LANGUAGE_OPTIONS}
            languageTargetState={getResources(activeCampaign.adAccountId)?.languageTargets.status ?? "idle"}
            updateCampaignAdGroup={updateCampaignAdGroup}
            toggleAdGroupGender={toggleAdGroupGender}
            toggleAdGroupAgeRange={toggleAdGroupAgeRange}
            addAd={addAd}
            duplicateAdGroup={duplicateAdGroup}
            duplicateAd={duplicateAd}
            removeAdGroup={removeAdGroup}
            removeAd={removeAd}
            openAdGroupEditor={openAdGroupEditor}
            openAdEditor={openAdEditor}
            onOpenCampaign={returnToCampaignEditor}
          />
        </HierarchyEditModal>
      ) : null}

      {activeCampaign && activeEditorGroup && activeEditorAd && editorFocus?.level === "ad" ? (
        <HierarchyEditModal
          eyebrow="编辑广告"
          hierarchyTrail={[
            { label: "广告系列", name: activeCampaign.campaignName, onClick: returnToCampaignEditor },
            { label: "广告组", name: activeEditorGroup.name, onClick: () => setEditorFocus({ level: "adgroup", campaignId: activeCampaign.id, groupId: activeEditorGroup.id }) },
            { label: "广告", name: activeEditorAd.name },
          ]}
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
            errors={adErrors[`${activeCampaign.id}:${activeEditorGroup.id}:${activeEditorAd.id}`]}
            groupErrors={activeCampaignGroupErrors}
            adErrors={activeCampaignAdErrors}
            geoTargets={getResources(activeCampaign.adAccountId)?.geoTargets.data ?? FALLBACK_GEO_TARGET_OPTIONS}
            languageTargets={getResources(activeCampaign.adAccountId)?.languageTargets.data ?? FALLBACK_LANGUAGE_OPTIONS}
            updateCampaignAd={updateCampaignAd}
            addAd={addAd}
            duplicateAdGroup={duplicateAdGroup}
            duplicateAd={duplicateAd}
            removeAdGroup={removeAdGroup}
            removeAd={removeAd}
            openAdGroupEditor={openAdGroupEditor}
            openAdEditor={openAdEditor}
            onOpenCampaign={returnToCampaignEditor}
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

      {renderPresetManager()}
      {renderPresetDialog()}
    </div>
  );
}
