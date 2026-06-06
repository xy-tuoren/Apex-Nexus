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

export async function listCampaignPresets() {
  const presets = await listCollection("campaign_presets");
  return presets.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCampaignPreset(input: CampaignPresetCreateInput) {
  const now = timestamp();
  const preset: CampaignPreset = {
    id: newId("preset"),
    name: input.name,
    description: input.description,
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
