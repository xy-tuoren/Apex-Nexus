"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <Button
      aria-label={theme === "light" ? "切换为暗色模式" : "切换为浅色模式"}
      className="h-9 w-9 shrink-0 px-0"
      onClick={toggleTheme}
      type="button"
      variant="ghost"
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      )}
    </Button>
  );
}
