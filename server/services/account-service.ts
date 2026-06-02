import type { GoogleAdAccount, Site, SiteAdAccount } from "@/lib/types";
import { discoverGoogleAdsAccounts } from "@/server/google-ads/account-discovery";
import {
  audit,
  findById,
  listCollection,
  replaceCollection,
  updateById,
} from "@/server/repositories/data-store";

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
  const bindings: SiteAdAccount[] = discovered.adAccounts.flatMap((account) =>
    sites.map((site) => ({
      siteId: site.id,
      adAccountId: account.id,
    })),
  );

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
