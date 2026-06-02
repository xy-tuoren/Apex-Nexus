import { getAccessToken } from "@/server/google-ads/oauth";
import { customerResource } from "@/server/google-ads/resource-names";
import type { GoogleAccountKind, GoogleAdAccount, GoogleMccAccount } from "@/lib/types";

const GOOGLE_ADS_API = "https://googleads.googleapis.com/v24";

type SearchRow = Record<string, Record<string, unknown>>;

function requireCredentials() {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    throw new Error("缺少 GOOGLE_ADS_DEVELOPER_TOKEN，无法从 Google Ads 拉取账号。");
  }
  return developerToken;
}

export function parseCustomerIdFromResource(resourceName: string) {
  const match = resourceName.match(/customers\/(\d+)/);
  return match?.[1] ?? resourceName.replace(/\D/g, "");
}

async function googleAdsFetch(path: string, init?: RequestInit) {
  const developerToken = requireCredentials();
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error(
      "缺少 Google Ads OAuth 凭证（CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN），无法拉取账号。",
    );
  }

  const response = await fetch(`${GOOGLE_ADS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload !== null
        ? JSON.stringify(payload)
        : `Google Ads API 请求失败 (${response.status})`,
    );
  }

  return payload;
}

export async function listAccessibleCustomerIds() {
  const payload = (await googleAdsFetch("/customers:listAccessibleCustomers")) as {
    resourceNames?: string[];
  };

  return (payload.resourceNames ?? [])
    .map(parseCustomerIdFromResource)
    .filter(Boolean);
}

function flattenSearchStream(payload: unknown): SearchRow[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((chunk) => {
    if (!chunk || typeof chunk !== "object" || !("results" in chunk)) {
      return [];
    }
    const results = (chunk as { results?: SearchRow[] }).results;
    return results ?? [];
  });
}

export async function searchGoogleAdsLive(
  customerId: string,
  loginCustomerId: string,
  query: string,
) {
  const payload = await googleAdsFetch(
    `/customers/${customerResource(customerId)}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        "login-customer-id": customerResource(loginCustomerId),
      },
      body: JSON.stringify({ query }),
    },
  );

  return flattenSearchStream(payload);
}

function readString(value: unknown) {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function mapCustomerStatus(status: unknown): GoogleAdAccount["status"] {
  const normalized = readString(status).toUpperCase();
  if (normalized === "ENABLED") {
    return "ENABLED";
  }
  if (normalized === "PAUSED" || normalized === "SUSPENDED" || normalized === "CLOSED") {
    return "PAUSED";
  }
  return "UNKNOWN";
}

function isEnabledStatus(status: unknown) {
  return readString(status).toUpperCase() === "ENABLED";
}

type CustomerProfile = {
  customerId: string;
  name: string;
  manager: boolean;
  currencyCode: string;
  timeZone: string;
  status: GoogleAdAccount["status"];
  testAccount: boolean;
};

type ManagedClient = {
  customerId: string;
  name: string;
  manager: boolean;
  status: GoogleAdAccount["status"];
  level: number;
};

async function fetchCustomerProfile(
  customerId: string,
  loginCustomerId = customerId,
): Promise<CustomerProfile | null> {
  const rows = await searchGoogleAdsLive(
    customerId,
    loginCustomerId,
    `SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code, customer.time_zone, customer.status, customer.test_account FROM customer LIMIT 1`,
  );

  const customer = rows[0]?.customer;
  if (!customer) {
    return null;
  }

  return {
    customerId: readString(customer.id) || customerId,
    name: readString(customer.descriptiveName) || `Account ${customerId}`,
    manager: Boolean(customer.manager),
    currencyCode: readString(customer.currencyCode) || "USD",
    timeZone: readString(customer.timeZone) || "UTC",
    status: mapCustomerStatus(customer.status),
    testAccount: Boolean(customer.testAccount),
  };
}

async function fetchManagedClients(
  managerCustomerId: string,
  loginCustomerId = managerCustomerId,
): Promise<ManagedClient[]> {
  const rows = await searchGoogleAdsLive(
    managerCustomerId,
    loginCustomerId,
    `SELECT customer_client.client_customer, customer_client.descriptive_name, customer_client.manager, customer_client.status, customer_client.level FROM customer_client WHERE customer_client.level <= 1`,
  );

  return rows
    .map((row) => row.customerClient)
    .filter((client): client is Record<string, unknown> => Boolean(client))
    .map((client) => {
      const clientCustomer = readString(client.clientCustomer);
      return {
        customerId: parseCustomerIdFromResource(clientCustomer),
        name: readString(client.descriptiveName) || clientCustomer,
        manager: Boolean(client.manager),
        status: mapCustomerStatus(client.status),
        level: Number(client.level ?? 1),
      };
    })
    .filter((client) => client.customerId);
}

export type DiscoveredAccounts = {
  mccAccounts: GoogleMccAccount[];
  adAccounts: GoogleAdAccount[];
  accessibleCustomerIds: string[];
  skippedAccounts: {
    customerId: string;
    name: string;
    reason: string;
  }[];
  syncedAt: string;
};

export async function discoverGoogleAdsAccounts(): Promise<DiscoveredAccounts> {
  const accessibleCustomerIds = await listAccessibleCustomerIds();
  if (accessibleCustomerIds.length === 0) {
    throw new Error("Google Ads 未返回任何可访问账号，请确认 Refresh Token 授权范围。");
  }

  const profiles = (
    await Promise.all(accessibleCustomerIds.map((customerId) => fetchCustomerProfile(customerId)))
  ).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const managerProfiles = profiles.filter((profile) => profile.manager);
  const standaloneProfiles = profiles.filter((profile) => !profile.manager && !profile.testAccount);

  const mccRecords = new Map<string, GoogleMccAccount>();
  const adRecords = new Map<string, GoogleAdAccount>();
  const skippedAccounts: DiscoveredAccounts["skippedAccounts"] = [];

  const now = new Date().toISOString();

  const upsertMcc = (
    customerId: string,
    name: string,
    kind: Extract<GoogleAccountKind, "DATA_MCC" | "OPERATION_MCC">,
    parentCustomerId?: string,
  ) => {
    const id = `mcc-sync-${customerId}`;
    mccRecords.set(customerId, {
      id,
      customerId,
      name,
      kind,
      parentCustomerId,
      canManageClients: true,
      lastSyncedAt: now,
    });
    return id;
  };

  async function walkManagerTree({
    manager,
    loginCustomerId,
    parentCustomerId,
    isRoot,
    visited,
  }: {
    manager: Pick<CustomerProfile, "customerId" | "name">;
    loginCustomerId: string;
    parentCustomerId?: string;
    isRoot: boolean;
    visited: Set<string>;
  }) {
    if (visited.has(manager.customerId)) {
      return;
    }
    visited.add(manager.customerId);

    const mccId = upsertMcc(
      manager.customerId,
      manager.name,
      isRoot ? "DATA_MCC" : "OPERATION_MCC",
      parentCustomerId,
    );

    let clients: ManagedClient[] = [];
    try {
      clients = await fetchManagedClients(manager.customerId, loginCustomerId);
    } catch (error) {
      skippedAccounts.push({
        customerId: manager.customerId,
        name: manager.name,
        reason: `无法读取该 MCC 下级账号：${error instanceof Error ? error.message : "未知错误"}`,
      });
      return;
    }

    for (const client of clients) {
      if (client.customerId === manager.customerId || client.level !== 1) {
        continue;
      }

      if (!isEnabledStatus(client.status)) {
        skippedAccounts.push({
          customerId: client.customerId,
          name: client.name,
          reason: `账号状态不是 ENABLED（当前：${client.status}）`,
        });
        continue;
      }

      if (client.manager) {
        await walkManagerTree({
          manager: {
            customerId: client.customerId,
            name: client.name,
          },
          loginCustomerId,
          parentCustomerId: manager.customerId,
          isRoot: false,
          visited,
        });
        continue;
      }

      try {
        const childProfile = await fetchCustomerProfile(client.customerId, loginCustomerId);
        if (!childProfile || childProfile.manager || childProfile.testAccount) {
          skippedAccounts.push({
            customerId: client.customerId,
            name: client.name,
            reason: childProfile?.testAccount
              ? "测试账号，已跳过"
              : "不是可投放的叶子广告账号",
          });
          continue;
        }

        if (!isEnabledStatus(childProfile.status)) {
          skippedAccounts.push({
            customerId: client.customerId,
            name: childProfile.name || client.name,
            reason: `账号状态不是 ENABLED（当前：${childProfile.status}）`,
          });
          continue;
        }

        adRecords.set(client.customerId, {
          id: `ad-sync-${client.customerId}`,
          customerId: client.customerId,
          name: childProfile.name || client.name,
          operationMccId: mccId,
          loginCustomerId,
          currencyCode: childProfile.currencyCode,
          timeZone: childProfile.timeZone,
          status: childProfile.status,
        });
      } catch (error) {
        skippedAccounts.push({
          customerId: client.customerId,
          name: client.name,
          reason: `无法读取投放账号详情：${error instanceof Error ? error.message : "未知错误"}`,
        });
      }
    }
  }

  const visitedManagers = new Set<string>();
  for (const [index, manager] of managerProfiles.entries()) {
    await walkManagerTree({
      manager,
      loginCustomerId: manager.customerId,
      isRoot: index === 0,
      visited: visitedManagers,
    });
  }

  for (const profile of standaloneProfiles) {
    if (adRecords.has(profile.customerId)) {
      continue;
    }

    const fallbackMcc =
      managerProfiles[0] ??
      ({ customerId: profile.customerId, name: profile.name } as (typeof managerProfiles)[number]);
    const mccId = mccRecords.has(fallbackMcc.customerId)
      ? mccRecords.get(fallbackMcc.customerId)!.id
      : upsertMcc(
          fallbackMcc.customerId,
          fallbackMcc.name,
          managerProfiles.length === 0 ? "OPERATION_MCC" : "OPERATION_MCC",
        );

    adRecords.set(profile.customerId, {
      id: `ad-sync-${profile.customerId}`,
      customerId: profile.customerId,
      name: profile.name,
      operationMccId: mccId,
      loginCustomerId: fallbackMcc.customerId,
      currencyCode: profile.currencyCode,
      timeZone: profile.timeZone,
      status: profile.status,
    });
  }

  if (adRecords.size === 0 && managerProfiles.length > 0) {
    throw new Error(
      "已识别到 MCC，但未找到可投放的子账号。请确认账号层级，或该 Token 仅有 MCC 查看权限。",
    );
  }

  if (adRecords.size === 0) {
    throw new Error("未找到可投放的广告账号（非测试、非 MCC 经理账号）。");
  }

  return {
    mccAccounts: [...mccRecords.values()],
    adAccounts: [...adRecords.values()],
    accessibleCustomerIds,
    skippedAccounts,
    syncedAt: now,
  };
}
