"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  notify: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const notify = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}:${Math.random()}`;
    setToasts((current) => [...current, { ...toast, id }].slice(-4));
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={9000}>
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            className={cn(
              "grid w-[min(30rem,calc(100vw-2rem))] grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-xl border bg-[var(--surface-card)] p-4 text-[var(--ink)] shadow-[0_18px_60px_rgba(15,23,42,0.22)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
              toast.tone === "success"
                ? "border-[var(--semantic-success)]/35"
                : "border-[var(--semantic-error)]/35",
            )}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
              }
            }}
          >
            {toast.tone === "success" ? (
              <CheckCircle2
                aria-hidden
                className="mt-0.5 h-5 w-5 text-[var(--semantic-success)]"
                strokeWidth={1.8}
              />
            ) : (
              <AlertCircle
                aria-hidden
                className="mt-0.5 h-5 w-5 text-[var(--semantic-error)]"
                strokeWidth={1.8}
              />
            )}
            <div className="min-w-0">
              <ToastPrimitive.Title className="text-sm font-semibold">
                {toast.title}
              </ToastPrimitive.Title>
              {toast.description ? (
                <ToastPrimitive.Description className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[var(--muted)]">
                  {toast.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]">
              <X aria-hidden className="h-4 w-4" strokeWidth={1.8} />
              <span className="sr-only">关闭通知</span>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[1200] flex max-w-full flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
