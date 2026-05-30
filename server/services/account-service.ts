import {
  audit,
  listCollection,
  timestamp,
  updateById,
} from "@/server/repositories/data-store";

export async function syncAccounts() {
  const mccAccounts = await listCollection("google_mcc_accounts");

  await Promise.all(
    mccAccounts.map((account) =>
      updateById("google_mcc_accounts", account.id, {
        lastSyncedAt: timestamp(),
      }),
    ),
  );

  const [updatedMccAccounts, adAccounts] = await Promise.all([
    listCollection("google_mcc_accounts"),
    listCollection("google_ad_accounts"),
  ]);

  await audit("accounts.sync", undefined, {
    mccCount: updatedMccAccounts.length,
    adAccountCount: adAccounts.length,
  });

  return {
    mccAccounts: updatedMccAccounts,
    adAccounts,
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
