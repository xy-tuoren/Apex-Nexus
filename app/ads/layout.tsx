import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "广告投放 · Apex Nexus",
  description: "创建 Google Ads Campaign、AdGroup 与广告，并同步真实投放账号。",
};

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
