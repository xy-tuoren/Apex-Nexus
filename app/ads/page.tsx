import { AdminShell } from "@/components/layout/admin-shell";
import { CampaignHierarchyEditor } from "@/components/ads/campaign-hierarchy";
import { generateDefaultCampaignName } from "@/components/ads/campaign-hierarchy/form-utils";
import { isAuthEnabled } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/server";
import {
  listAllAdAccounts,
  listMccAccounts,
  listSites,
} from "@/server/services/account-service";
import { listCampaignPresets } from "@/server/services/campaign-preset-service";
import { listLaunchBatches } from "@/server/services/launch-service";
import type { CampaignPreset, GoogleAdAccount, GoogleMccAccount, LaunchBatch, Site } from "@/lib/types";

export default async function AdsLaunchPage() {
  const accountData = await Promise.all([
    listAllAdAccounts(),
    listMccAccounts(),
    listSites(),
    listCampaignPresets().then((r) => r.items),
    listLaunchBatches(),
  ]);
  const [adAccounts, mccAccounts, sites, presets, launchBatches] = JSON.parse(
    JSON.stringify(accountData),
  ) as [GoogleAdAccount[], GoogleMccAccount[], Site[], CampaignPreset[], LaunchBatch[]];
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
          initialCampaignName={generateDefaultCampaignName()}
          initialMccAccounts={mccAccounts}
          initialSites={sites}
          initialPresets={presets}
          initialLaunchBatches={launchBatches}
        />
      </div>
    </AdminShell>
  );
}
