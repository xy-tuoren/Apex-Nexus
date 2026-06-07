import type { GoogleAdAccount, Site, SiteAdAccount } from "@/lib/types";
import type { SiteCreateInput, SiteUpdateInput } from "@/lib/schemas/campaign";
import { discoverGoogleAdsAccounts } from "@/server/google-ads/account-discovery";
import {
  audit,
  findById,
  insertOne,
  listCollection,
  newId,
  replaceCollection,
  updateById,
} from "@/server/repositories/data-store";

const DEFAULT_DAILY_BUDGET_LIMIT_MICROS = 500_000_000;

function normalizeSiteDomain(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("请输入站点。");
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .replace(/^www\./, "")
      .toLowerCase();
  }
}

function siteNameFromInput(input: string, domain: string) {
  const trimmed = input.trim();
  return trimmed.includes("/") || trimmed.includes(".") ? domain : trimmed;
}

function buildSiteAccountBindings(sites: Site[], adAccounts: GoogleAdAccount[]) {
  return sites.flatMap((site) =>
    adAccounts
      .filter((account) => account.operationMccId === site.operationMccId)
      .map((account) => ({
        siteId: site.id,
        adAccountId: account.id,
      })),
  );
}

export async function getLoginCustomerIdForAdAccount(adAccountId: string) {
  const adAccount = await findById("google_ad_accounts", adAccountId);
  if (!adAccount) {
    return null;
  }

  if (adAccount.loginCustomerId) {
    return adAccount.loginCustomerId;
  }

  const operationMcc = await findById("google_mcc_accounts", adAccount.operationMccId);
  return operationMcc?.customerId ?? adAccount.customerId;
}

export async function syncAccounts() {
  const discovered = await discoverGoogleAdsAccounts();

  await replaceCollection("google_mcc_accounts", discovered.mccAccounts);
  await replaceCollection("google_ad_accounts", discovered.adAccounts);

  const sites = await listCollection("sites");
  const bindings: SiteAdAccount[] = buildSiteAccountBindings(sites, discovered.adAccounts);

  await replaceCollection("site_ad_accounts", bindings);

  const primaryOperationMcc =
    discovered.mccAccounts.find((account) => account.kind === "OPERATION_MCC") ??
    discovered.mccAccounts[0];

  if (sites[0] && primaryOperationMcc) {
    await updateById("sites", sites[0].id, {
      operationMccId: primaryOperationMcc.id,
    });
  }

  const [updatedSites, mccAccounts, adAccounts] = await Promise.all([
    listCollection("sites"),
    listCollection("google_mcc_accounts"),
    listCollection("google_ad_accounts"),
  ]);

  await audit("accounts.sync", undefined, {
    mccCount: mccAccounts.length,
    adAccountCount: adAccounts.length,
    accessibleCustomerIds: discovered.accessibleCustomerIds,
    syncedAt: discovered.syncedAt,
    source: "google_ads_api",
  });

  return {
    mccAccounts,
    adAccounts,
    sites: updatedSites,
    bindings,
    accessibleCustomerIds: discovered.accessibleCustomerIds,
    syncedAt: discovered.syncedAt,
    source: "google_ads_api" as const,
  };
}

export async function listSites() {
  return listCollection("sites");
}

export async function createSite(input: SiteCreateInput) {
  const operationMcc = await findById("google_mcc_accounts", input.operationMccId);
  if (!operationMcc || operationMcc.kind !== "OPERATION_MCC") {
    throw new Error("请选择有效的操作 MCC。");
  }

  const domain = normalizeSiteDomain(input.site);
  const existingSites = await listCollection("sites");
  if (existingSites.some((site) => site.domain === domain)) {
    throw new Error("该站点已存在，请直接更新绑定。");
  }

  const site: Site = {
    id: newId("site"),
    name: siteNameFromInput(input.site, domain),
    domain,
    brandName: siteNameFromInput(input.site, domain),
    defaultFinalUrl: `https://${domain}`,
    defaultLanguage: "all",
    defaultLocations: ["geoTargetConstants/2840"],
    operationMccId: input.operationMccId,
    dailyBudgetLimitMicros: DEFAULT_DAILY_BUDGET_LIMIT_MICROS,
  };

  await insertOne("sites", site);
  await refreshSiteAccountBindings();
  await audit("site.create", site.id, {
    domain: site.domain,
    operationMccId: site.operationMccId,
  });
  return site;
}

export async function updateSiteBinding(siteId: string, input: SiteUpdateInput) {
  const [site, operationMcc] = await Promise.all([
    findById("sites", siteId),
    findById("google_mcc_accounts", input.operationMccId),
  ]);
  if (!site) {
    return null;
  }
  if (!operationMcc || operationMcc.kind !== "OPERATION_MCC") {
    throw new Error("请选择有效的操作 MCC。");
  }

  const updated = await updateById("sites", siteId, {
    operationMccId: input.operationMccId,
  });
  await refreshSiteAccountBindings();
  await audit("site.operation_mcc.update", siteId, {
    operationMccId: input.operationMccId,
  });
  return updated;
}

export async function refreshSiteAccountBindings() {
  const [sites, adAccounts] = await Promise.all([
    listCollection("sites"),
    listCollection("google_ad_accounts"),
  ]);
  const bindings = buildSiteAccountBindings(sites, adAccounts);
  await replaceCollection("site_ad_accounts", bindings);
  return bindings;
}

export async function listAccountsForSite(siteId: string) {
  const [bindings, adAccounts] = await Promise.all([
    listCollection("site_ad_accounts"),
    listCollection("google_ad_accounts"),
  ]);

  const accountIds = new Set(
    bindings.filter((binding) => binding.siteId === siteId).map((binding) => binding.adAccountId),
  );

  return adAccounts.filter((account) => accountIds.has(account.id));
}

export async function listAllAdAccounts() {
  return listCollection("google_ad_accounts");
}

export async function listMccAccounts() {
  return listCollection("google_mcc_accounts");
}

export function groupAccountsBySite(
  sites: Site[],
  bindings: SiteAdAccount[],
  adAccounts: GoogleAdAccount[],
) {
  const accountMap = new Map(adAccounts.map((account) => [account.id, account]));

  return Object.fromEntries(
    sites.map((site) => [
      site.id,
      bindings
        .filter((binding) => binding.siteId === site.id)
        .map((binding) => accountMap.get(binding.adAccountId))
        .filter((account): account is GoogleAdAccount => Boolean(account)),
    ]),
  );
}
