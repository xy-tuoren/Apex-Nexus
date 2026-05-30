import type { ApiError } from "@/lib/types";

export function toGoogleAdsError(error: unknown): ApiError {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      return {
        code: "GOOGLE_ADS_ERROR",
        message: parsed.error?.message ?? "Google Ads API returned an error.",
        details: parsed,
      };
    } catch {
      return {
        code: "GOOGLE_ADS_ERROR",
        message: error.message,
      };
    }
  }

  return {
    code: "GOOGLE_ADS_ERROR",
    message: "Unknown Google Ads API error.",
    details: error,
  };
}
