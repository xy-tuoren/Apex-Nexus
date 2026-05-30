import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle>后台登录占位页</CardTitle>
          <CardDescription>
            当前 MVP 还未接入真实身份系统。这个页面用于避免开发阶段外部路径跳转产生 404。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {from ? (
            <div className="mb-4 rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-500">
              requested: {from}
            </div>
          ) : null}
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              建议后续接入
            </div>
            <p className="mt-2 leading-6">
              NextAuth、企业 SSO 或内部账号系统，并把站点、账号和预算权限绑定到用户角色。
            </p>
          </div>
          <Button asChild className="mt-5 w-full">
            <Link href="/">返回工作台</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
