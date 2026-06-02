import Link from "next/link";
import {
  Activity,
  Building2,
  ChevronRight,
  Megaphone,
  PackageCheck,
} from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isAuthEnabled } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/server";
import { listAccountsForSite, listSites } from "@/server/services/account-service";
import { listCampaignDrafts } from "@/server/services/campaign-draft-service";
import { listAssets } from "@/server/services/asset-service";
import { listLaunchJobs } from "@/server/services/launch-service";

export default async function HomePage() {
  const [sites, assets, drafts, jobs] = await Promise.all([
    listSites(),
    listAssets(),
    listCampaignDrafts(),
    listLaunchJobs(),
  ]);

  const selectedSite = sites[0];
  const accounts = selectedSite ? await listAccountsForSite(selectedSite.id) : [];
  const user = await getSessionUser();
  const authEnabled = isAuthEnabled();

  const statCards = [
    { label: "站点", value: sites.length, icon: Building2 },
    { label: "投放账号", value: accounts.length, icon: Activity },
    { label: "素材", value: assets.length, icon: PackageCheck },
    { label: "投放任务", value: jobs.length, icon: Activity },
  ];

  return (
    <AdminShell activePath="/" showLoginButton={!authEnabled} user={user}>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <section
          aria-labelledby="home-heading"
          className="animate-fade-up border-b border-[var(--hairline)] py-12 lg:py-16"
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-end">
            <div className="max-w-2xl">
              <div className="section-eyebrow">
                <p className="text-caption-uppercase text-[var(--muted)]">Platform Console</p>
              </div>
              <h1 className="text-heading-xl mt-4 text-[var(--ink)]" id="home-heading">
                业务后台
                <span className="block text-[var(--body-strong)]">工作台</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--body)]">
                多站点 Google Ads 投放管理入口。创建广告系列、校验素材与预览 mutate 请进入广告投放页。
              </p>
            </div>

            <div className="hero-panel animate-fade-up stagger-2">
              <p className="meta-kicker">Live Snapshot</p>
              <div className="mt-3 space-y-0">
                <div className="hero-panel-row">
                  <span className="text-body-sm text-[var(--muted)]">当前站点</span>
                  <span className="truncate text-sm font-medium text-[var(--ink)]">
                    {selectedSite?.name ?? "暂无站点"}
                  </span>
                </div>
                <div className="hero-panel-row">
                  <span className="text-body-sm text-[var(--muted)]">草稿 / 任务</span>
                  <span className="font-mono text-sm tabular-nums text-[var(--ink)]">
                    {drafts.length} / {jobs.length}
                  </span>
                </div>
              </div>
              <Button asChild className="mt-5 w-full sm:w-auto">
                <Link href="/ads">
                  进入广告投放
                  <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="stats-heading" className="section-band py-12">
          <div className="mb-5">
            <div className="section-eyebrow">
              <p className="text-caption-uppercase text-[var(--muted)]">Overview</p>
            </div>
            <h2 className="text-heading-lg mt-2 text-[var(--ink)]" id="stats-heading">
              关键指标
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item, index) => (
              <Card key={item.label} className={`stat-card p-5 animate-fade-up stagger-${index + 1}`}>
                <p className="text-caption-uppercase text-[var(--muted)]">{item.label}</p>
                <p className="text-metric mt-3 text-[var(--ink)]">{item.value}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <Card className="feature-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div aria-hidden className="voice-icon-plate">
                  <Megaphone className="h-4 w-4 text-[var(--body-strong)]" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">广告投放</h2>
                  <p className="mt-1 text-body-sm text-[var(--body)]">
                    Campaign / AdGroup / Ad 创建、账号同步、草稿校验与 mutate 预览。
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href="/ads">打开投放页</Link>
              </Button>
            </div>
          </Card>
        </section>

        <footer className="page-footer">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Apex Nexus · Google Ads Operations Console</p>
            <p className="font-mono text-xs text-[var(--muted-soft)]">v0.1</p>
          </div>
        </footer>
      </div>
    </AdminShell>
  );
}
