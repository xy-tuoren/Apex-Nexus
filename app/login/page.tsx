import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--canvas)] p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="gradient-orb orb-lavender left-1/4 top-1/4 h-64 w-64" />
        <div className="gradient-orb orb-mint right-1/4 bottom-1/4 h-56 w-56" />
      </div>

      <Card className="animate-fade-up relative w-full max-w-md">
        <CardHeader>
          <div className="voice-icon-plate mb-4 h-12 w-12">
            <LockKeyhole className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.75} />
          </div>
          <CardTitle className="font-display text-2xl font-light">后台登录占位页</CardTitle>
          <CardDescription>
            当前 MVP 还未接入真实身份系统。这个页面用于避免开发阶段外部路径跳转产生 404。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {from ? (
            <div className="mb-4 rounded-lg border border-[var(--hairline-strong)] bg-[var(--canvas-soft)] p-3 text-sm text-[var(--body)]">
              requested: <span className="text-[var(--ink)]">{from}</span>
            </div>
          ) : null}
          <div className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4 text-body-sm text-[var(--body)]">
            <div className="flex items-center gap-2 font-medium text-[var(--ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--semantic-success)]" />
              建议后续接入
            </div>
            <p className="mt-2 leading-relaxed">
              NextAuth、企业 SSO 或内部账号系统，并把站点、账号和预算权限绑定到用户角色。
            </p>
          </div>
          <Button asChild className="mt-6 w-full">
            <Link href="/">返回工作台</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
