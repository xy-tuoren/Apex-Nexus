import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/db/mongodb";
import type {
  CampaignDraft,
  CampaignMetricsDaily,
  CreativeAsset,
  GoogleAdAccount,
  GoogleCampaignBinding,
  GoogleMccAccount,
  LaunchJob,
  Site,
  SiteAdAccount,
  DraftValidationResult,
} from "@/lib/types";

type Collections = {
  google_mcc_accounts: GoogleMccAccount[];
  google_ad_accounts: GoogleAdAccount[];
  sites: Site[];
  site_ad_accounts: SiteAdAccount[];
  assets: CreativeAsset[];
  campaign_drafts: CampaignDraft[];
  google_campaign_bindings: GoogleCampaignBinding[];
  launch_jobs: LaunchJob[];
  draft_validation_results: DraftValidationResult[];
  campaign_metrics_daily: CampaignMetricsDaily[];
  api_idempotency_keys: {
    key: string;
    scope: string;
    requestHash: string;
    response: unknown;
    createdAt: string;
  }[];
  audit_logs: {
    id: string;
    action: string;
    entityId?: string;
    payload?: unknown;
    createdAt: string;
  }[];
};

const now = () => new Date().toISOString();

const seed: Collections = {
  google_mcc_accounts: [
    {
      id: "mcc-data-1",
      customerId: "1000000000",
      name: "Global Data MCC",
      kind: "DATA_MCC",
      canManageClients: true,
      lastSyncedAt: now(),
    },
    {
      id: "mcc-op-demo",
      customerId: "2000000000",
      name: "Site A Operation MCC",
      kind: "OPERATION_MCC",
      parentCustomerId: "1000000000",
      canManageClients: true,
      lastSyncedAt: now(),
    },
  ],
  google_ad_accounts: [
    {
      id: "ad-demo-1",
      customerId: "3000000001",
      name: "Site A Launch Account 1",
      operationMccId: "mcc-op-demo",
      currencyCode: "USD",
      timeZone: "Asia/Shanghai",
      status: "ENABLED",
    },
    {
      id: "ad-demo-2",
      customerId: "3000000002",
      name: "Site A Launch Account 2",
      operationMccId: "mcc-op-demo",
      currencyCode: "USD",
      timeZone: "Asia/Shanghai",
      status: "ENABLED",
    },
  ],
  sites: [
    {
      id: "site-demo",
      name: "Aurora Commerce",
      domain: "aurora.example",
      brandName: "Aurora",
      defaultFinalUrl: "https://aurora.example/landing",
      defaultLanguage: "zh-CN",
      defaultLocations: ["CN", "US"],
      operationMccId: "mcc-op-demo",
      dailyBudgetLimitMicros: 500_000_000,
    },
  ],
  site_ad_accounts: [
    { siteId: "site-demo", adAccountId: "ad-demo-1" },
    { siteId: "site-demo", adAccountId: "ad-demo-2" },
  ],
  assets: [],
  campaign_drafts: [],
  google_campaign_bindings: [],
  launch_jobs: [],
  draft_validation_results: [],
  campaign_metrics_daily: [],
  api_idempotency_keys: [],
  audit_logs: [],
};

const memory: Collections = structuredClone(seed);

export function newId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export async function listCollection<K extends keyof Collections>(
  collectionName: K,
): Promise<Collections[K]> {
  const db = await getMongoDb();
  if (!db) {
    return memory[collectionName];
  }

  return db.collection(collectionName).find({}).toArray() as unknown as Promise<Collections[K]>;
}

export async function insertOne<K extends keyof Collections>(
  collectionName: K,
  document: Collections[K][number],
) {
  const db = await getMongoDb();
  if (!db) {
    (memory[collectionName] as Collections[K][number][]).push(document);
    return document;
  }

  await db.collection(collectionName).insertOne(document as never);
  return document;
}

export async function updateById<K extends keyof Collections>(
  collectionName: K,
  id: string,
  patch: Partial<Collections[K][number]>,
) {
  const db = await getMongoDb();
  if (!db) {
    const items = memory[collectionName] as Array<Collections[K][number] & { id?: string }>;
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...patch };
      return items[index];
    }
    return null;
  }

  await db.collection(collectionName).updateOne({ id }, { $set: patch });
  return db.collection(collectionName).findOne({ id });
}

export async function findById<K extends keyof Collections>(
  collectionName: K,
  id: string,
) {
  const items = await listCollection(collectionName);
  return (items as Array<Collections[K][number] & { id?: string }>).find(
    (item) => item.id === id,
  );
}

export async function audit(action: string, entityId?: string, payload?: unknown) {
  return insertOne("audit_logs", {
    id: newId("audit"),
    action,
    entityId,
    payload,
    createdAt: now(),
  });
}

export function timestamp() {
  return now();
}
