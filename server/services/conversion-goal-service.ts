import { findById } from "@/server/repositories/data-store";
import { searchGoogleAdsLive } from "@/server/google-ads/account-discovery";
import { getLoginCustomerIdForAdAccount } from "@/server/services/account-service";

type GoogleAdsRow = Record<string, Record<string, unknown> | undefined>;

export type ConversionGoalPoint = {
  id: string;
  category: string;
  origin: string;
  biddable: boolean;
  source: string;
  actionCount: number;
  actions: {
    id: string;
    name: string;
    category: string;
    type: string;
    status: string;
    includeInConversionsMetric: boolean;
    primaryForGoal: boolean;
  }[];
};

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
