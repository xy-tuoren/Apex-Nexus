"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type ToastTone = "success" | "warning" | "error";

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
  const notify = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const options = {
      description: toast.description,
      duration: 9000,
    };

    if (toast.tone === "success") {
      sonnerToast.success(toast.title, options);
      return;
    }

    if (toast.tone === "warning") {
      sonnerToast.warning(toast.title, options);
      return;
    }

    sonnerToast.error(toast.title, options);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <Toaster position="bottom-right" />
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
