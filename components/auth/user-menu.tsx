"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth/types";

type UserMenuProps = {
  user: AuthUser;
};

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-card)] py-1 pl-1 pr-3 sm:flex">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-7 w-7 rounded-full object-cover"
            height={28}
            src={user.avatarUrl}
            width={28}
          />
        ) : (
          <div
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-strong)] text-xs font-semibold text-[var(--ink)]"
          >
            {user.name.slice(0, 1)}
          </div>
        )}
        <span className="max-w-[8rem] truncate text-sm font-medium text-[var(--ink)]">
          {user.name}
        </span>
      </div>
      <Button
        aria-label="退出登录"
        className="h-9 w-9 px-0"
        onClick={handleLogout}
        type="button"
        variant="ghost"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
