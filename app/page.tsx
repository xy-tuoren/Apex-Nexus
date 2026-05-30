import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  ChevronRight,
  CheckCircle2,
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
import { listAccountsForSite, listSites } from "@/server/services/account-service";
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

  const statCards = [
    { label: "站点", value: sites.length, icon: Building2, stagger: "stagger-1" },
    { label: "真实投放账号", value: accounts.length, icon: Users, stagger: "stagger-2" },
    { label: "素材", value: assets.length, icon: PackageCheck, stagger: "stagger-3" },
    { label: "投放任务", value: jobs.length, icon: Activity, stagger: "stagger-4" },
  ];

  return (
    <main className="relative min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="gradient-orb orb-mint -left-24 top-[-6rem] h-[28rem] w-[28rem]" />
        <div className="gradient-orb orb-peach right-[-5rem] top-[20%] h-[22rem] w-[22rem]" />
        <div className="gradient-orb orb-lavender bottom-[10%] left-[30%] h-[20rem] w-[20rem]" />
        <div className="gradient-orb orb-sky right-[15%] bottom-[-4rem] h-[18rem] w-[18rem]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="voice-icon-plate h-9 w-9">
              <Rocket className="h-4 w-4 text-[var(--ink)]" />
            </div>
            <div className="hidden sm:block">
              <p className="font-display text-base leading-none text-[var(--ink)]">Apex Nexus</p>
              <p className="mt-1 text-caption-uppercase text-[var(--muted)]">Admin</p>
            </div>
          </div>

          <nav className="nav-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {navigation.map((item) => (
              <button
                key={item.label}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[15px] font-medium transition ${
                  item.active
                    ? "bg-[var(--surface-strong)] text-[var(--ink)]"
                    : "text-[var(--body)] hover:bg-[var(--hairline-soft)] hover:text-[var(--ink)]"
                }`}
                type="button"
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Badge className="hidden md:inline-flex">
              {dryRunEnabled ? "Dry Run" : "Live API"}
            </Badge>
            <Button size="sm" type="button">
              新建投放任务
            </Button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1200px] px-6">
        <div className="animate-fade-up relative overflow-hidden py-16 lg:py-24">
          <div
            aria-hidden
            className="gradient-orb orb-rose absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-40"
          />
          <div className="relative max-w-2xl">
            <p className="text-caption-uppercase text-[var(--muted)]">Platform Console</p>
            <h1 className="text-display-lg mt-3 text-[var(--ink)]">业务后台工作台</h1>
            <p className="mt-5 max-w-xl text-body-sm text-[var(--body)]">
              多站点 Google Ads 投放管理 — 账号链路、素材校验、草稿预览与暂停态任务，统一在此调度。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="button">创建广告草稿</Button>
              <Button type="button" variant="outline">
                同步账号
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-12 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item) => (
              <Card
                key={item.label}
                className={`animate-fade-up p-6 ${item.stagger}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-caption-uppercase text-[var(--muted)]">{item.label}</p>
                    <p className="font-display mt-3 text-4xl tabular-nums text-[var(--ink)]">
                      {item.value}
                    </p>
                  </div>
                  <div className="voice-icon-plate">
                    <item.icon className="h-4 w-4 text-[var(--body-strong)]" strokeWidth={1.75} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="animate-fade-up stagger-5 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)]">
              <div className="relative border-b border-[var(--hairline)] px-6 py-8 lg:px-8">
                <div
                  aria-hidden
                  className="gradient-orb orb-sky absolute -right-16 -top-16 h-48 w-48 opacity-30"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-caption-uppercase text-[var(--muted)]">System Modules</p>
                    <h2 className="text-display-sm mt-2 text-[var(--ink)]">后台能力总览</h2>
                    <p className="mt-3 max-w-2xl text-body-sm text-[var(--body)]">
                      Google Ads 投放只是广告运营模块的一部分；平台还需要承载站点资产、
                      账号权限、素材、报表、AI 自动化和风控。
                    </p>
                  </div>
                  <Badge>Admin IA v2</Badge>
                </div>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                {businessModules.map((module) => (
                  <div
                    key={module.title}
                    className="feature-card group cursor-default p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="voice-icon-plate">
                        <module.icon className="h-4 w-4 text-[var(--body-strong)]" strokeWidth={1.75} />
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--muted-soft)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ink)]" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-[var(--ink)]">{module.title}</h3>
                    <p className="mt-2 text-body-sm text-[var(--body)]">{module.description}</p>
                    <Badge className="mt-4">{module.stats}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="animate-fade-up stagger-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" strokeWidth={1.75} />
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
                        className="group flex w-full items-center justify-between py-4 text-left transition first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-[var(--ink)]">{type}</p>
                          <p className="mt-0.5 text-sm text-[var(--muted)]">
                            草稿、校验、预览、暂停态创建
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="normal-case tracking-normal">Google Ads</Badge>
                          <ChevronRight className="h-4 w-4 text-[var(--muted-soft)] group-hover:text-[var(--ink)]" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button className="mt-6 w-full" type="button">
                    创建广告草稿
                  </Button>
                </CardContent>
              </Card>

              <Card className="animate-fade-up stagger-7">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WalletCards className="h-5 w-5" strokeWidth={1.75} />
                    当前站点
                  </CardTitle>
                  <CardDescription>
                    站点决定操作 MCC、真实投放账号、域名白名单和预算上限。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-5">
                    <div className="grid gap-2">
                      <Label>站点</Label>
                      <Input readOnly value={selectedSite?.name ?? "暂无站点"} />
                    </div>
                    <div className="grid gap-2">
                      <Label>默认落地页</Label>
                      <Input readOnly value={selectedSite?.defaultFinalUrl ?? ""} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="animate-fade-up stagger-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" strokeWidth={1.75} />
                  Google Ads 账号链路
                </CardTitle>
                <CardDescription>
                  Header 使用操作 MCC，URL customerId 使用真实投放账号。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {accounts.map((account) => (
                  <div key={account.id} className="hairline-row flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--ink)]">{account.name}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{account.customerId}</p>
                    </div>
                    <Badge className="normal-case tracking-normal text-[var(--semantic-success)]">
                      {account.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-fade-up stagger-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5" strokeWidth={1.75} />
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
                    <span className="text-[var(--muted)]">POST</span>
                    <span className="ml-2 text-[var(--ink)]">/api/{endpoint}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-fade-up stagger-7">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                  风控检查
                </CardTitle>
                <CardDescription>高风险动作拆成预览和执行两步。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {["域名白名单", "预算上限", "素材规格", "幂等键", "审计日志"].map((item) => (
                  <div key={item} className="hairline-row flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--semantic-success)]" />
                    <span className="text-body-sm font-medium text-[var(--ink)]">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <Card className="animate-fade-up stagger-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" strokeWidth={1.75} />
                  投放流程状态
                </CardTitle>
                <CardDescription>
                  真正创建 Google Ads 资源时仍使用一次{" "}
                  <code className="rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 text-sm text-[var(--ink)]">
                    googleAds:mutate
                  </code>
                  。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {launchSteps.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-4 text-center"
                    >
                      <p className="text-caption-uppercase text-[var(--muted-soft)]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--ink)]">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-up stagger-7">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                    环境状态
                  </CardTitle>
                  {!dryRunEnabled ? (
                    <Badge className="border-[var(--semantic-success)]/30 bg-[var(--semantic-success)]/10 normal-case tracking-normal text-[var(--semantic-success)]">
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
                      className="hairline-row flex items-center justify-between"
                    >
                      <span className="text-body-sm text-[var(--muted)]">{label}</span>
                      <span className="text-sm font-medium text-[var(--ink)]">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
