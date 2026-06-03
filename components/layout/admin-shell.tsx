import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Database,
  Megaphone,
  MonitorCog,
  PackageCheck,
  Rocket,
  Settings2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth/types";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPath: string;
  enabled: boolean;
};

const navigation: NavItem[] = [
  { label: "工作台", href: "/", icon: MonitorCog, matchPath: "/", enabled: false },
  { label: "广告投放", href: "/ads", icon: Megaphone, matchPath: "/ads", enabled: true },
  { label: "账号中心", href: "/accounts", icon: Database, matchPath: "/accounts", enabled: false },
  { label: "素材中心", href: "/assets", icon: PackageCheck, matchPath: "/assets", enabled: false },
  { label: "数据报表", href: "/reports", icon: BarChart3, matchPath: "/reports", enabled: false },
  { label: "系统设置", href: "/settings", icon: Settings2, matchPath: "/settings", enabled: false },
];

type AdminShellProps = {
  children: React.ReactNode;
  activePath: string;
  user: AuthUser | null;
  showLoginButton: boolean;
};

export function AdminShell({
  children,
  activePath,
  user,
  showLoginButton,
}: AdminShellProps) {
  return (
    <main className="canvas-surface min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-none items-center gap-4 px-4 lg:px-8">
          <Link className="flex shrink-0 items-center gap-3" href="/">
            <div aria-hidden className="brand-mark">
              <Rocket className="h-4 w-4 text-[var(--ink)]" strokeWidth={1.75} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none text-[var(--ink)]">Apex Nexus</p>
              <p className="mt-1 text-caption-uppercase text-[var(--muted)]">Admin</p>
            </div>
          </Link>

          <nav aria-label="主导航" className="nav-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {navigation.map((item) => {
              const match = item.matchPath;
              const isActive =
                match === "/"
                  ? activePath === "/"
                  : activePath === match || activePath.startsWith(`${match}/`);
              const className = `flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition duration-200 ${
                isActive
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-primary)] shadow-[var(--shadow-soft)]"
                  : item.enabled
                    ? "border-transparent text-[var(--body)] hover:border-[var(--hairline)] hover:bg-[var(--hairline-soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]/25"
                    : "border-transparent text-[var(--muted)] opacity-60"
              }`;

              if (!item.enabled) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className={className}
                  >
                    <item.icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                  href={item.href}
                >
                  <item.icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {user ? <UserMenu user={user} /> : null}
            {showLoginButton ? (
              <Button asChild size="sm">
                <Link href="/login">登录</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
