import Link from "next/link";
import { AlertCircle, CheckCircle2, LockKeyhole } from "lucide-react";
import { FeishuLoginButton } from "@/components/auth/feishu-login-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAuthEnabled } from "@/lib/auth/config";
import { getSessionUser } from "@/lib/auth/server";

const errorMessages: Record<string, string> = {
  auth_not_configured: "飞书登录尚未配置，请联系管理员补齐环境变量。",
  missing_code: "授权未完成，请重新发起飞书登录。",
  invalid_state: "登录状态校验失败，请重新发起飞书登录。",
  oauth_failed: "飞书授权失败，请稍后重试。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const authEnabled = isAuthEnabled();
  const user = await getSessionUser();

  if (user) {
    return (
      <main className="login-stage flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
        <Card className="login-card w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-heading-lg font-semibold">你已登录</CardTitle>
            <CardDescription>
              当前账号：{user.name}
              {user.email ? `（${user.email}）` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" render={<Link href={from && from.startsWith("/") ? from : "/"} />}>
              进入工作台
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const errorMessage = error ? (errorMessages[error] ?? "登录失败，请重试。") : null;

  return (
    <main className="login-stage flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4 sm:p-6">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <Card className="login-card animate-fade-up w-full max-w-md">
        <CardHeader>
          <div aria-hidden className="brand-mark mb-5 h-11 w-11 rounded-xl">
            <LockKeyhole className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.75} />
          </div>
          <div className="section-eyebrow">
            <p className="text-caption-uppercase text-[var(--muted)]">Authentication</p>
          </div>
          <CardTitle className="mt-3 text-heading-lg font-semibold">登录 Apex Nexus</CardTitle>
          <CardDescription>
            使用企业飞书账号登录后台。登录后可访问工作台与全部 API。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div
              className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--semantic-error)]/30 bg-[var(--semantic-error)]/5 p-3 text-sm text-[var(--body)]"
              role="alert"
            >
              <AlertCircle
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--semantic-error)]"
              />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {authEnabled ? (
            <>
              <FeishuLoginButton className="w-full" from={from} />
              <div className="mt-4 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4 text-body-sm text-[var(--body)]">
                <div className="flex items-center gap-2 font-medium text-[var(--ink)]">
                  <CheckCircle2
                    aria-hidden
                    className="h-4 w-4 text-[var(--semantic-success)]"
                  />
                  飞书 OAuth 已启用
                </div>
                <p className="mt-2 leading-relaxed">
                  首次登录会跳转至飞书授权页，同意后即可进入控制台。
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-4 text-body-sm text-[var(--body)]">
              <p className="font-medium text-[var(--ink)]">开发模式：认证未启用</p>
              <p className="mt-2 leading-relaxed">
                在 `.env.local` 中配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`AUTH_SECRET`
                后重启服务，即可启用飞书登录与路由保护。
              </p>
              <Button className="mt-4 w-full" render={<Link href="/" />} variant="outline">
                暂不登录，进入工作台
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
