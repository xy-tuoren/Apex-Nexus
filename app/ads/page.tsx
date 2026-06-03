import { AdminShell } from "@/components/layout/admin-shell";
import { CampaignHierarchyEditor } from "@/components/ads/campaign-hierarchy";
import { isAuthEnabled } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/server";
import {
  listAllAdAccounts,
  listMccAccounts,
} from "@/server/services/account-service";

export default async function AdsLaunchPage() {
  const [adAccounts, mccAccounts] = await Promise.all([
    listAllAdAccounts(),
    listMccAccounts(),
  ]);
  const accountsSyncedAt =
    mccAccounts
      .map((account) => account.lastSyncedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  const user = await getSessionUser();
  const authEnabled = isAuthEnabled();

  return (
    <AdminShell activePath="/ads" showLoginButton={!authEnabled} user={user}>
      <div className="w-full px-4 pb-28 lg:px-8">
        <CampaignHierarchyEditor
          initialAdAccounts={adAccounts}
          accountsSyncedAt={accountsSyncedAt}
          initialMccAccounts={mccAccounts}
        />
      </div>
    </AdminShell>
  );
}
