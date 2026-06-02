import { AdminShell } from "@/components/layout/admin-shell";
import { LaunchBuilder } from "@/components/ads/launch-builder";
import { isAuthEnabled } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/server";
import {
  listAllAdAccounts,
  listMccAccounts,
} from "@/server/services/account-service";
import { listCampaignDrafts } from "@/server/services/campaign-draft-service";
import { listLaunchJobs } from "@/server/services/launch-service";

export default async function AdsLaunchPage() {
  const [adAccounts, drafts, jobs, mccAccounts] = await Promise.all([
    listAllAdAccounts(),
    listCampaignDrafts(),
    listLaunchJobs(),
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
      <div className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6">
        <LaunchBuilder
          initialAdAccounts={adAccounts}
          accountsSyncedAt={accountsSyncedAt}
          draftCount={drafts.length}
          initialMccAccounts={mccAccounts}
          jobCount={jobs.length}
        />
      </div>
    </AdminShell>
  );
}
