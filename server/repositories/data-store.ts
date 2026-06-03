import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/db/mongodb";
import type {
  CampaignDraft,
  CampaignMetricsDaily,
  CreativeAsset,
  GoogleAdAccount,
  GoogleCampaignBinding,
  GoogleConversionGoalSet,
  GoogleMccAccount,
  LaunchJob,
  Site,
  SiteAdAccount,
  DraftValidationResult,
} from "@/lib/types";

type Collections = {
  google_mcc_accounts: GoogleMccAccount[];
  google_ad_accounts: GoogleAdAccount[];
  google_conversion_goal_sets: GoogleConversionGoalSet[];
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
  google_mcc_accounts: [],
  google_ad_accounts: [],
  google_conversion_goal_sets: [],
  sites: [
    {
      id: "site-demo",
      name: "Aurora Commerce",
      domain: "aurora.example",
      brandName: "Aurora",
      defaultFinalUrl: "",
      defaultLanguage: "zh-CN",
      defaultLocations: ["CN", "US"],
      operationMccId: "",
      dailyBudgetLimitMicros: 500_000_000,
    },
  ],
  site_ad_accounts: [],
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

function serializeMongoDocument<T>(document: unknown): T {
  if (!document || typeof document !== "object") {
    return document as T;
  }

  const { _id: _ignored, ...rest } = document as Record<string, unknown>;
  return rest as T;
}

function serializeMongoDocuments<T>(documents: unknown[]): T[] {
  return documents.map((document) => serializeMongoDocument<T>(document));
}

export async function replaceCollection<K extends keyof Collections>(
  collectionName: K,
  documents: Collections[K],
) {
  const db = await getMongoDb();
  if (!db) {
    memory[collectionName] = structuredClone(documents) as Collections[K];
    return memory[collectionName];
  }

  const collection = db.collection(collectionName);
  await collection.deleteMany({});
  if (documents.length > 0) {
    await collection.insertMany(documents as never[]);
  }

  return documents;
}

export async function listCollection<K extends keyof Collections>(
  collectionName: K,
): Promise<Collections[K]> {
  const db = await getMongoDb();
  if (!db) {
    return memory[collectionName];
  }

  const documents = await db.collection(collectionName).find({}).toArray();
  return serializeMongoDocuments<Collections[K][number]>(documents) as Collections[K];
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
  const document = await db.collection(collectionName).findOne({ id });
  return document ? serializeMongoDocument<Collections[K][number]>(document) : null;
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
