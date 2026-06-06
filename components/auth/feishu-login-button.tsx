import { Button } from "@/components/ui/button";

type FeishuLoginButtonProps = {
  from?: string;
  className?: string;
};

export function FeishuLoginButton({ from = "/", className }: FeishuLoginButtonProps) {
  const href =
    from && from !== "/"
      ? `/api/auth/feishu?from=${encodeURIComponent(from)}`
      : "/api/auth/feishu";

  return (
    <Button className={className} render={<a href={href} />}>
      使用飞书账号登录
    </Button>
  );
}
