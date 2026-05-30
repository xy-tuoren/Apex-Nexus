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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Rocket className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">Launchpad Admin</p>
              <p className="mt-1 text-xs text-slate-500">多站点广告运营平台</p>
            </div>
          </div>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navigation.map((item) => (
              <button
                key={item.label}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  item.active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                type="button"
              >
                <item.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Badge className="hidden bg-slate-100 text-slate-700 md:inline-flex">
              {dryRunEnabled ? "Dry Run" : "Live API"}
            </Badge>
            <Button size="sm" type="button">
              新建投放任务
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Platform Console
          </p>
          <h1 className="mt-1 text-xl font-semibold">业务后台工作台</h1>
        </div>

        <div className="space-y-6 p-4 lg:p-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "站点", value: sites.length, icon: Building2 },
                { label: "真实投放账号", value: accounts.length, icon: Users },
                { label: "素材", value: assets.length, icon: PackageCheck },
                { label: "投放任务", value: jobs.length, icon: Activity },
              ].map((item) => (
                <Card key={item.label} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <Card className="p-0">
                <div className="border-b border-slate-200 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">系统模块</p>
                      <h2 className="mt-1 text-2xl font-semibold">后台能力总览</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Google Ads 投放只是广告运营模块的一部分；平台还需要承载站点资产、
                        账号权限、素材、报表、AI 自动化和风控。
                      </p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700">Admin IA v2</Badge>
                  </div>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  {businessModules.map((module) => (
                    <div
                      key={module.title}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                          <module.icon className="h-5 w-5" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-500" />
                      </div>
                      <h3 className="mt-4 font-semibold">{module.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>
                      <Badge className="mt-4 bg-white text-slate-600">{module.stats}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-blue-600" />
                      广告运营快捷入口
                    </CardTitle>
                    <CardDescription>
                      当前只实现 Google Ads PMax / Demand Gen，后续可继续加 Meta、TikTok 等渠道。
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {["Performance Max", "Demand Gen"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div>
                            <p className="font-semibold">{type}</p>
                            <p className="text-xs text-slate-500">草稿、校验、预览、暂停态创建</p>
                          </div>
                          <Badge className="bg-slate-100">Google Ads</Badge>
                        </button>
                      ))}
                    </div>
                    <Button className="mt-4 w-full" type="button">
                      创建广告草稿
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <WalletCards className="h-5 w-5 text-blue-600" />
                      当前站点
                    </CardTitle>
                    <CardDescription>
                      站点决定操作 MCC、真实投放账号、域名白名单和预算上限。
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
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

            <div className="grid gap-6 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Google Ads 账号链路
                  </CardTitle>
                  <CardDescription>
                    Header 使用操作 MCC，URL customerId 使用真实投放账号。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div>
                        <p className="font-semibold">{account.name}</p>
                        <p className="font-mono text-xs text-slate-500">{account.customerId}</p>
                      </div>
                      <Badge>{account.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers3 className="h-5 w-5" />
                    原子 API 契约
                  </CardTitle>
                  <CardDescription>
                    UI 与 AI 共用同一批服务端接口，避免 AI 直接拼 Google Ads JSON。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {[
                    "accounts.sync",
                    "assets.validate",
                    "campaign-drafts.create",
                    "campaign-drafts.preview",
                    "launch-jobs.create",
                    "campaigns.enable/pause/budget",
                  ].map((endpoint) => (
                    <div
                      key={endpoint}
                      className="rounded-xl bg-slate-950 px-3 py-2 font-mono text-xs text-blue-100"
                    >
                      {endpoint}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    风控检查
                  </CardTitle>
                  <CardDescription>高风险动作拆成预览和执行两步。</CardDescription>
                </CardHeader>
                <CardContent>
                  {["域名白名单", "预算上限", "素材规格", "幂等键", "审计日志"].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-900"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-semibold">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    投放流程状态
                  </CardTitle>
                  <CardDescription>
                    真正创建 Google Ads 资源时仍使用一次 `googleAds:mutate`。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-6">
                    {launchSteps.map((step, index) => (
                      <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-400">Step {index + 1}</p>
                        <p className="mt-2 font-semibold">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    环境状态
                  </CardTitle>
                  <CardDescription>
                    开发环境默认 dry-run，不会误投真实广告。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      ["MongoDB", process.env.MONGODB_URI ? "已配置" : "内存种子数据"],
                      ["Google Ads", dryRunEnabled ? "Dry Run" : "Live"],
                      ["草稿", `${drafts.length}`],
                      ["任务", `${jobs.length}`],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm text-slate-500">{label}</span>
                        <span className="text-sm font-semibold">{value}</span>
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
