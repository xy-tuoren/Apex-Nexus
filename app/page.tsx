import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Database,
  FileText,
  Layers3,
  Megaphone,
  MonitorCog,
  PackageCheck,
  Rocket,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Fragment } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { listAccountsForSite, listSites } from "@/server/services/account-service";
import { getSessionUser } from "@/lib/auth/server";
import { isAuthEnabled } from "@/lib/auth/config";
import { listAssets } from "@/server/services/asset-service";
import { listCampaignDrafts } from "@/server/services/campaign-draft-service";
import { listLaunchJobs } from "@/server/services/launch-service";

const navigation = [
  { label: "工作台", icon: MonitorCog, active: true },
  { label: "站点资产", icon: Building2 },
  { label: "账号中心", icon: Database },
  { label: "广告运营", icon: Megaphone },
  { label: "素材中心", icon: PackageCheck },
  { label: "数据报表", icon: BarChart3 },
  { label: "AI 自动化", icon: Bot },
  { label: "系统风控", icon: ShieldCheck },
];

const heroHighlights = [
  "账号链路与素材规格统一校验",
  "草稿预览后按暂停态安全创建",
  "UI 与 AI 共用同一套原子 API",
];

const businessModules = [
  {
    title: "站点资产",
    description: "维护站点域名、品牌、默认落地页、国家语言和可投放账号绑定。",
    icon: Building2,
    stats: "1 个站点",
  },
  {
    title: "账号中心",
    description: "同步数据 MCC、操作 MCC、真实投放账号和 Google Ads 权限链路。",
    icon: Database,
    stats: "2 个投放账号",
  },
  {
    title: "广告运营",
    description: "创建 PMax / Demand Gen 草稿、校验素材、生成预览并提交暂停态任务。",
    icon: Megaphone,
    stats: "投放功能入口",
  },
  {
    title: "素材中心",
    description: "管理图片、Logo、YouTube 视频、标题和描述，并按广告类型校验。",
    icon: PackageCheck,
    stats: "可复用素材",
  },
  {
    title: "数据报表",
    description: "后续承接 campaign、asset group、ad group、cost、conversion 等日报。",
    icon: BarChart3,
    stats: "SearchStream",
  },
  {
    title: "AI 自动化",
    description: "给 AI 暴露幂等原子 API：查询、草稿、校验、预览、任务、启停预算。",
    icon: Bot,
    stats: "13 个接口",
  },
];

const launchSteps = ["草稿", "校验", "预览", "任务", "暂停态", "启用"];

function launchStepState(index: number, draftsCount: number, jobsCount: number) {
  if (index === 0 && draftsCount > 0) return "complete";
  if (index <= 2 && draftsCount > 0) return "complete";
  if (index <= 4 && jobsCount > 0) return "complete";
  if (index === 3 && jobsCount > 0) return "active";
  if (index === 0) return "active";
  return "upcoming";
}

export default async function Home() {
  const [sites, assets, drafts, jobs] = await Promise.all([
    listSites(),
    listAssets(),
    listCampaignDrafts(),
    listLaunchJobs(),
  ]);
  const selectedSite = sites[0];
  const accounts = selectedSite ? await listAccountsForSite(selectedSite.id) : [];
  const dryRunEnabled = process.env.GOOGLE_ADS_DRY_RUN !== "false";
  const user = await getSessionUser();
  const authEnabled = isAuthEnabled();

  const statCards = [
    { label: "站点", value: sites.length, icon: Building2, stagger: "stagger-1" },
    { label: "真实投放账号", value: accounts.length, icon: Users, stagger: "stagger-2" },
    { label: "素材", value: assets.length, icon: PackageCheck, stagger: "stagger-3" },
    { label: "投放任务", value: jobs.length, icon: Activity, stagger: "stagger-4" },
  ];

  return (
    <main className="canvas-surface min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div aria-hidden className="brand-mark">
              <Rocket className="h-4 w-4 text-[var(--ink)]" strokeWidth={1.75} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none text-[var(--ink)]">Apex Nexus</p>
              <p className="mt-1 text-caption-uppercase text-[var(--muted)]">Admin</p>
            </div>
          </div>

          <nav
            aria-label="主导航"
            className="nav-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
          >
            {navigation.map((item) => (
              <button
                key={item.label}
                aria-current={item.active ? "page" : undefined}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]/25 ${
                  item.active
                    ? "bg-[var(--surface-strong)] text-[var(--ink)]"
                    : "text-[var(--body)] hover:bg-[var(--hairline-soft)] hover:text-[var(--ink)]"
                }`}
                type="button"
              >
                <item.icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Badge className="hidden md:inline-flex">
              {dryRunEnabled ? "Dry Run" : "Live API"}
            </Badge>
            {user ? <UserMenu user={user} /> : null}
            {!authEnabled ? (
              <Button asChild size="sm">
                <Link href="/login">登录</Link>
              </Button>
            ) : null}
            <Button size="sm" type="button">
              新建投放任务
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <section
          aria-labelledby="dashboard-heading"
          className="animate-fade-up border-b border-[var(--hairline)] py-12 lg:py-16"
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-end">
            <div className="max-w-2xl">
              <div className="section-eyebrow">
                <p className="text-caption-uppercase text-[var(--muted)]">Platform Console</p>
              </div>
              <h1 className="text-heading-xl mt-4 text-[var(--ink)]" id="dashboard-heading">
                业务后台
                <span className="block text-[var(--body-strong)]">工作台</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--body)]">
                多站点 Google Ads 投放管理 — 账号链路、素材校验、草稿预览与暂停态任务，统一在此调度。
              </p>
              <ul className="mt-6 space-y-2.5">
                {heroHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-body-sm text-[var(--body)]">
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--ink)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="hero-panel animate-fade-up stagger-2">
                <p className="meta-kicker">Live Snapshot</p>
                <div className="mt-3">
                  <div className="hero-panel-row">
                    <span className="text-body-sm text-[var(--muted)]">运行模式</span>
                    <Badge className="normal-case tracking-normal">
                      {dryRunEnabled ? "Dry Run" : "Live API"}
                    </Badge>
                  </div>
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
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="flex-1 sm:flex-none" type="button">
                  创建广告草稿
                </Button>
                <Button className="flex-1 sm:flex-none" type="button" variant="outline">
                  同步账号
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="stats-heading" className="section-band animate-fade-up stagger-3">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="section-eyebrow">
                  <p className="text-caption-uppercase text-[var(--muted)]">Overview</p>
                </div>
                <h2 className="text-heading-lg mt-2 text-[var(--ink)]" id="stats-heading">
                  关键指标
                </h2>
              </div>
              <p className="hidden max-w-[16rem] text-right text-body-sm leading-relaxed text-[var(--muted)] sm:block">
                站点、账号、素材与任务在同一视图汇总。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((item) => (
                <Card key={item.label} className={`stat-card animate-fade-up p-5 ${item.stagger}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-caption-uppercase text-[var(--muted)]">{item.label}</p>
                      <p className="text-metric mt-3 text-[var(--ink)]">{item.value}</p>
                    </div>
                    <div aria-hidden className="voice-icon-plate">
                      <item.icon className="h-4 w-4 text-[var(--body-strong)]" strokeWidth={1.75} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-14 py-12 pb-8 sm:px-0">
          <section aria-labelledby="modules-heading" className="section-block">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="panel-shell animate-fade-up stagger-5">
                <div className="panel-header">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="section-eyebrow">
                        <p className="text-caption-uppercase text-[var(--muted)]">System Modules</p>
                      </div>
                      <h2 className="text-heading-lg mt-2 text-[var(--ink)]" id="modules-heading">
                        后台能力总览
                      </h2>
                      <p className="mt-2 max-w-2xl text-body-sm text-[var(--body)]">
                        Google Ads 投放只是广告运营模块的一部分；平台还需要承载站点资产、
                        账号权限、素材、报表、AI 自动化和风控。
                      </p>
                    </div>
                    <Badge>Admin IA v2</Badge>
                  </div>
                </div>
                <div className="grid gap-3 p-4 md:grid-cols-2 lg:p-5">
                  {businessModules.map((module, index) => (
                    <div
                      key={module.title}
                      className="feature-card group cursor-pointer p-5 focus-within:ring-2 focus-within:ring-[var(--ink)]/15"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                        <ChevronRight
                          aria-hidden
                          className="h-4 w-4 text-[var(--muted-soft)] transition duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--ink)]"
                        />
                      </div>
                      <div aria-hidden className="voice-icon-plate mt-4">
                        <module.icon
                          className="h-4 w-4 text-[var(--body-strong)]"
                          strokeWidth={1.75}
                        />
                      </div>
                      <h3 className="mt-4 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                        {module.title}
                      </h3>
                      <p className="mt-1.5 text-body-sm text-[var(--body)]">{module.description}</p>
                      <Badge className="mt-3">{module.stats}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Card className="animate-fade-up stagger-6">
                  <CardHeader className="mb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Megaphone aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                      广告运营快捷入口
                    </CardTitle>
                    <CardDescription>
                      当前只实现 Google Ads PMax / Demand Gen，后续可继续加 Meta、TikTok 等渠道。
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-[var(--hairline)]">
                      {["Performance Max", "Demand Gen"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="interactive-row group flex w-full items-center justify-between py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]/20"
                        >
                          <div>
                            <p className="font-medium text-[var(--ink)]">{type}</p>
                            <p className="mt-0.5 text-sm text-[var(--muted)]">
                              草稿、校验、预览、暂停态创建
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="normal-case tracking-normal">Google Ads</Badge>
                            <ChevronRight
                              aria-hidden
                              className="h-4 w-4 text-[var(--muted-soft)] group-hover:text-[var(--ink)]"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                    <Button className="mt-5 w-full" type="button">
                      创建广告草稿
                    </Button>
                  </CardContent>
                </Card>

                <Card className="animate-fade-up stagger-7">
                  <CardHeader className="mb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <WalletCards aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                      当前站点
                    </CardTitle>
                    <CardDescription>
                      站点决定操作 MCC、真实投放账号、域名白名单和预算上限。
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="site-name">站点</Label>
                        <Input id="site-name" readOnly value={selectedSite?.name ?? "暂无站点"} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="site-url">默认落地页</Label>
                        <Input
                          id="site-url"
                          readOnly
                          value={selectedSite?.defaultFinalUrl ?? ""}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section aria-labelledby="operations-heading" className="section-block">
            <div className="mb-5">
              <div className="section-eyebrow">
                <p className="text-caption-uppercase text-[var(--muted)]">Operations</p>
              </div>
              <h2 className="text-heading-lg mt-2 text-[var(--ink)]" id="operations-heading">
                运行态与契约
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="animate-fade-up stagger-5">
                <CardHeader className="mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    Google Ads 账号链路
                  </CardTitle>
                  <CardDescription>
                    Header 使用操作 MCC，URL customerId 使用真实投放账号。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="hairline-row flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--ink)]">{account.name}</p>
                        <p className="mt-0.5 truncate font-mono text-xs text-[var(--muted)]">
                          {account.customerId}
                        </p>
                      </div>
                      <Badge className="shrink-0 normal-case tracking-normal">
                        <CheckCircle2
                          aria-hidden
                          className="mr-1 h-3 w-3 text-[var(--semantic-success)]"
                        />
                        {account.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="animate-fade-up stagger-6">
                <CardHeader className="mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers3 aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    原子 API 契约
                  </CardTitle>
                  <CardDescription>
                    UI 与 AI 共用同一批服务端接口，避免 AI 直接拼 Google Ads JSON。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {[
                    "accounts.sync",
                    "assets.validate",
                    "campaign-drafts.create",
                    "campaign-drafts.preview",
                    "launch-jobs.create",
                    "campaigns.enable/pause/budget",
                  ].map((endpoint) => (
                    <div key={endpoint} className="hairline-row text-body-sm text-[var(--body)]">
                      <span className="font-mono text-xs text-[var(--muted)]">POST</span>
                      <span className="ml-2 font-mono text-[var(--ink)]">/api/{endpoint}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="animate-fade-up stagger-7">
                <CardHeader className="mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    风控检查
                  </CardTitle>
                  <CardDescription>高风险动作拆成预览和执行两步。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {["域名白名单", "预算上限", "素材规格", "幂等键", "审计日志"].map((item) => (
                    <div key={item} className="hairline-row flex items-center gap-3">
                      <CheckCircle2
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-[var(--semantic-success)]"
                      />
                      <span className="text-body-sm font-medium text-[var(--ink)]">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-labelledby="workflow-heading" className="section-block">
            <div className="mb-5">
              <div className="section-eyebrow">
                <p className="text-caption-uppercase text-[var(--muted)]">Workflow</p>
              </div>
              <h2 className="text-heading-lg mt-2 text-[var(--ink)]" id="workflow-heading">
                投放流程与环境
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="animate-fade-up stagger-6">
                <CardHeader className="mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    投放流程状态
                  </CardTitle>
                  <CardDescription>
                    真正创建 Google Ads 资源时仍使用一次{" "}
                    <code className="rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 font-mono text-xs text-[var(--ink)]">
                      googleAds:mutate
                    </code>
                    。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div aria-label="投放流程步骤" className="step-pipeline" role="list">
                    {launchSteps.map((step, index) => {
                      const state = launchStepState(index, drafts.length, jobs.length);

                      return (
                        <Fragment key={step}>
                          <div
                            className={`step-pipeline-item ${state === "active" ? "is-active" : ""} ${state === "complete" ? "is-complete" : ""}`}
                            role="listitem"
                          >
                            <div aria-hidden className="step-pipeline-node">
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <p className="text-caption-uppercase text-[var(--muted-soft)]">
                                Step {index + 1}
                              </p>
                              <p className="mt-1 text-sm font-medium text-[var(--ink)]">{step}</p>
                            </div>
                          </div>
                          {index < launchSteps.length - 1 ? (
                            <div aria-hidden className="step-pipeline-connector" />
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-up stagger-7">
                <CardHeader className="mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                      环境状态
                    </CardTitle>
                    {!dryRunEnabled ? (
                      <Badge className="normal-case tracking-normal">
                        <CheckCircle2
                          aria-hidden
                          className="mr-1 h-3 w-3 text-[var(--semantic-success)]"
                        />
                        Live
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription>开发环境默认 dry-run，不会误投真实广告。</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {[
                      ["MongoDB", process.env.MONGODB_URI ? "已配置" : "内存种子数据"],
                      ["Google Ads", dryRunEnabled ? "Dry Run" : "Live"],
                      ["草稿", `${drafts.length}`],
                      ["任务", `${jobs.length}`],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="hairline-row flex items-center justify-between gap-3"
                      >
                        <span className="text-body-sm text-[var(--muted)]">{label}</span>
                        <span className="text-sm font-medium tabular-nums text-[var(--ink)]">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <footer className="page-footer">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>Apex Nexus · Google Ads Operations Console</p>
              <p className="font-mono text-xs text-[var(--muted-soft)]">
                {dryRunEnabled ? "DRY_RUN" : "LIVE"} · v0.1
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
