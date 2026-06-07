import type { CampaignPreset } from "@/lib/types";
import type {
  CampaignPresetCreateInput,
  CampaignPresetUpdateInput,
} from "@/lib/schemas/campaign";
import {
  audit,
  findById,
  insertOne,
  listCollection,
  newId,
  replaceCollection,
  timestamp,
  updateById,
} from "@/server/repositories/data-store";

export async function listCampaignPresets(page = 1, pageSize = 10, search = "") {
  const presets = await listCollection("campaign_presets");
  const sorted = presets.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const filtered = search.trim()
    ? sorted.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : sorted;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, total, page, pageSize };
}

export async function createCampaignPreset(input: CampaignPresetCreateInput) {
  const now = timestamp();
  const preset: CampaignPreset = {
    id: newId("preset"),
    name: input.name,
    description: input.description,
    siteId: input.siteId,
    scope: "GLOBAL",
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
  };

  await insertOne("campaign_presets", preset);
  await audit("campaign_preset.create", preset.id, { name: preset.name });
  return preset;
}

export async function updateCampaignPreset(id: string, input: CampaignPresetUpdateInput) {
  const existing = await findById("campaign_presets", id);
  if (!existing) {
    return null;
  }

  const preset = await updateById("campaign_presets", id, {
    ...input,
    updatedAt: timestamp(),
  });
  await audit("campaign_preset.update", id, { name: input.name });
  return preset;
}

export async function deleteCampaignPreset(id: string) {
  const presets = await listCollection("campaign_presets");
  const existing = presets.find((preset) => preset.id === id);
  if (!existing) {
    return null;
  }

  const nextPresets = presets.filter((preset) => preset.id !== id);
  await replaceCollection("campaign_presets", nextPresets);
  await audit("campaign_preset.delete", id, { name: existing.name });
  return existing;
}
