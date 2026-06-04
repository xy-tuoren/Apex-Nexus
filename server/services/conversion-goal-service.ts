import { audit, findById, listCollection, replaceCollection, timestamp } from "@/server/repositories/data-store";
import { searchGoogleAdsLive } from "@/server/google-ads/account-discovery";
import { getLoginCustomerIdForAdAccount } from "@/server/services/account-service";
import type { GoogleConversionGoalPoint, GoogleConversionGoalSet, GoogleMccAccount } from "@/lib/types";

type GoogleAdsRow = Record<string, Record<string, unknown> | undefined>;

export type ConversionGoalPoint = GoogleConversionGoalPoint;

function readString(value: unknown) {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : Boolean(value);
}

function goalKey(category: string, origin: string) {
  return `${category}:${origin}`;
}

function normalizeCustomerId(value?: string | null) {
  if (!value) {
    return "";
  }

  const resourceMatch = value.match(/customers\/(\d+)/);
  if (resourceMatch?.[1]) {
    return resourceMatch[1];
  }

  const syncIdMatch = value.match(/^ad-sync-(\d+)$/);
  if (syncIdMatch?.[1]) {
    return syncIdMatch[1];
  }

  return /^\d+$/.test(value) ? value : "";
}

function actionOrigin(type: string) {
  if (type.includes("WEBPAGE") || type.includes("WEBSITE")) {
    return "WEBSITE";
  }
  if (type.includes("UPLOAD") || type.includes("CRM")) {
    return "UPLOAD";
  }
  if (type.includes("CALL")) {
    return "PHONE_CALL";
  }
  if (type.includes("APP")) {
    return "APP";
  }
  return "UNSPECIFIED";
}

type ConversionGoalLookup = {
  adAccountId: string;
  customerId?: string | null;
  loginCustomerId?: string | null;
};

export async function listConversionGoalPoints({
  adAccountId,
  customerId,
  loginCustomerId: requestedLoginCustomerId,
}: ConversionGoalLookup) {
  const adAccount = await findById("google_ad_accounts", adAccountId);
  const resolvedCustomerId =
    normalizeCustomerId(adAccount?.customerId) ||
    normalizeCustomerId(customerId) ||
    normalizeCustomerId(adAccountId);

  if (!resolvedCustomerId) {
    throw new Error("缺少有效的 Google Ads customerId，请重新同步账号。");
  }

  const loginCustomerId =
    normalizeCustomerId(requestedLoginCustomerId) ||
    normalizeCustomerId(adAccount?.loginCustomerId) ||
    normalizeCustomerId(adAccount ? await getLoginCustomerIdForAdAccount(adAccountId) : null);
  if (!loginCustomerId) {
    throw new Error("无法确定该投放账号的 login-customer-id。");
  }

  const [goalRows, actionRows] = await Promise.all([
    searchGoogleAdsLive(
      resolvedCustomerId,
      loginCustomerId,
      "SELECT customer_conversion_goal.category, customer_conversion_goal.origin, customer_conversion_goal.biddable FROM customer_conversion_goal",
    ),
    searchGoogleAdsLive(
      resolvedCustomerId,
      loginCustomerId,
      "SELECT conversion_action.id, conversion_action.name, conversion_action.category, conversion_action.type, conversion_action.status, conversion_action.include_in_conversions_metric, conversion_action.primary_for_goal FROM conversion_action WHERE conversion_action.status != REMOVED",
    ),
  ]);

  const actions = (actionRows as GoogleAdsRow[]).map((row) => {
    const action = row.conversionAction ?? {};
    const category = readString(action.category) || "UNSPECIFIED";
    const type = readString(action.type) || "UNSPECIFIED";

    return {
      id: readString(action.id),
      name: readString(action.name) || "未命名转化操作",
      category,
      type,
      status: readString(action.status) || "UNKNOWN",
      includeInConversionsMetric: readBoolean(action.includeInConversionsMetric),
      primaryForGoal: readBoolean(action.primaryForGoal),
      origin: actionOrigin(type),
    };
  });

  return (goalRows as GoogleAdsRow[]).map((row) => {
    const goal = row.customerConversionGoal ?? {};
    const category = readString(goal.category) || "UNSPECIFIED";
    const origin = readString(goal.origin) || "UNSPECIFIED";
    const matchedActions = actions.filter(
      (action) => action.category === category && action.origin === origin,
    );

    return {
      id: goalKey(category, origin),
      category,
      origin,
      biddable: readBoolean(goal.biddable),
      source: "customer_conversion_goal",
      actionCount: matchedActions.length,
      actions: matchedActions.map((action) => ({
        id: action.id,
        name: action.name,
        category: action.category,
        type: action.type,
        status: action.status,
        includeInConversionsMetric: action.includeInConversionsMetric,
        primaryForGoal: action.primaryForGoal,
      })),
    } satisfies ConversionGoalPoint;
  });
}

export async function listCampaignConversionGoalPoints({
  adAccountId,
  customerId,
  loginCustomerId: requestedLoginCustomerId,
  campaignResourceName,
}: ConversionGoalLookup & { campaignResourceName: string }) {
  const adAccount = await findById("google_ad_accounts", adAccountId);
  const resolvedCustomerId =
    normalizeCustomerId(adAccount?.customerId) ||
    normalizeCustomerId(customerId) ||
    normalizeCustomerId(adAccountId);

  if (!resolvedCustomerId) {
    throw new Error("缺少有效的 Google Ads customerId，请重新同步账号。");
  }

  const loginCustomerId =
    normalizeCustomerId(requestedLoginCustomerId) ||
    normalizeCustomerId(adAccount?.loginCustomerId) ||
    normalizeCustomerId(adAccount ? await getLoginCustomerIdForAdAccount(adAccountId) : null);
  if (!loginCustomerId) {
    throw new Error("无法确定该投放账号的 login-customer-id。");
  }

  const escapedCampaignResourceName = campaignResourceName
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
  const rows = await searchGoogleAdsLive(
    resolvedCustomerId,
    loginCustomerId,
    [
      "SELECT",
      "campaign_conversion_goal.resource_name,",
      "campaign_conversion_goal.campaign,",
      "campaign_conversion_goal.category,",
      "campaign_conversion_goal.origin,",
      "campaign_conversion_goal.biddable",
      "FROM campaign_conversion_goal",
      `WHERE campaign_conversion_goal.campaign = '${escapedCampaignResourceName}'`,
    ].join(" "),
  );

  return (rows as GoogleAdsRow[]).map((row) => {
    const goal = row.campaignConversionGoal ?? {};
    const category = readString(goal.category) || "UNSPECIFIED";
    const origin = readString(goal.origin) || "UNSPECIFIED";

    return {
      id: goalKey(category, origin),
      resourceName: readString(goal.resourceName),
      category,
      origin,
      biddable: readBoolean(goal.biddable),
      source: "campaign_conversion_goal",
      actionCount: 0,
      actions: [],
    } satisfies ConversionGoalPoint;
  });
}

function resolveMccCustomerId(mccAccount: GoogleMccAccount) {
  return normalizeCustomerId(mccAccount.customerId) || normalizeCustomerId(mccAccount.id);
}

async function getDataMccAccount(mccAccountId: string) {
  const mccAccount = await findById("google_mcc_accounts", mccAccountId);
  if (!mccAccount) {
    throw new Error("找不到数据 MCC，请先同步账号。");
  }
  if (mccAccount.kind !== "DATA_MCC") {
    throw new Error("转化目标需要从数据 MCC 同步，请选择数据 MCC。");
  }
  return mccAccount;
}

export async function getCachedConversionGoalSet(mccAccountId: string) {
  const sets = await listCollection("google_conversion_goal_sets");
  return sets.find((set) => set.mccAccountId === mccAccountId) ?? null;
}

export async function syncDataMccConversionGoalSet(mccAccountId: string) {
  const mccAccount = await getDataMccAccount(mccAccountId);
  const customerId = resolveMccCustomerId(mccAccount);
  if (!customerId) {
    throw new Error("数据 MCC 缺少有效的 customerId，请重新同步账号。");
  }

  const goals = await listConversionGoalPoints({
    adAccountId: mccAccount.id,
    customerId,
    loginCustomerId: customerId,
  });

  const goalSet: GoogleConversionGoalSet = {
    id: `conversion-goals-${mccAccount.id}`,
    mccAccountId: mccAccount.id,
    customerId,
    loginCustomerId: customerId,
    goals,
    syncedAt: timestamp(),
  };

  const currentSets = await listCollection("google_conversion_goal_sets");
  await replaceCollection("google_conversion_goal_sets", [
    ...currentSets.filter((set) => set.mccAccountId !== mccAccount.id),
    goalSet,
  ]);

  await audit("conversion_goals.sync", mccAccount.id, {
    customerId,
    goalCount: goals.length,
    source: "data_mcc",
  });

  return goalSet;
}
