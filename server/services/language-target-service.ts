import { findById } from "@/server/repositories/data-store";
import { searchGoogleAds } from "@/server/google-ads/client";
import { getLoginCustomerIdForAdAccount } from "@/server/services/account-service";

type GoogleAdsSearchChunk = {
  results?: GoogleAdsRow[];
};

type GoogleAdsRow = {
  languageConstant?: Record<string, unknown>;
};

export type LanguageTargetOption = {
  resourceName: string;
  id: string;
  code: string;
  name: string;
  targetable: boolean;
};

const FALLBACK_LANGUAGES: LanguageTargetOption[] = [
  { resourceName: "all", id: "all", code: "all", name: "所有语言", targetable: true },
  { resourceName: "languageConstants/1000", id: "1000", code: "en", name: "English", targetable: true },
  { resourceName: "languageConstants/1017", id: "1017", code: "zh", name: "Chinese", targetable: true },
  { resourceName: "languageConstants/1003", id: "1003", code: "es", name: "Spanish", targetable: true },
  { resourceName: "languageConstants/1002", id: "1002", code: "fr", name: "French", targetable: true },
  { resourceName: "languageConstants/1001", id: "1001", code: "de", name: "German", targetable: true },
  { resourceName: "languageConstants/1005", id: "1005", code: "ja", name: "Japanese", targetable: true },
  { resourceName: "languageConstants/1012", id: "1012", code: "ko", name: "Korean", targetable: true },
  { resourceName: "languageConstants/1018", id: "1018", code: "pt", name: "Portuguese", targetable: true },
  { resourceName: "languageConstants/1004", id: "1004", code: "it", name: "Italian", targetable: true },
  { resourceName: "languageConstants/1011", id: "1011", code: "nl", name: "Dutch", targetable: true },
  { resourceName: "languageConstants/1035", id: "1035", code: "ru", name: "Russian", targetable: true },
  { resourceName: "languageConstants/1023", id: "1023", code: "ar", name: "Arabic", targetable: true },
  { resourceName: "languageConstants/1027", id: "1027", code: "hi", name: "Hindi", targetable: true },
  { resourceName: "languageConstants/1041", id: "1041", code: "tr", name: "Turkish", targetable: true },
];

function readString(value: unknown) {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : Boolean(value);
}

function normalizeCustomerId(value?: string | null) {
  if (!value) {
    return "";
  }

  const resourceMatch = value.match(/customers\/(\d+)/);
  if (resourceMatch?.[1]) {
    return resourceMatch[1];
  }

  const syncIdMatch = value.match(/^ad-sync-(\d+)$/);
  if (syncIdMatch?.[1]) {
    return syncIdMatch[1];
  }

  return /^\d+$/.test(value) ? value : "";
}

function flattenSearchStream(payload: unknown): GoogleAdsRow[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((chunk) => {
    if (!chunk || typeof chunk !== "object") {
      return [];
    }
    return (chunk as GoogleAdsSearchChunk).results ?? [];
  });
}

function mapLanguage(row: GoogleAdsRow): LanguageTargetOption | null {
  const language = row.languageConstant ?? {};
  const resourceName = readString(language.resourceName);

  if (!resourceName) {
    return null;
  }

  return {
    resourceName,
    id: readString(language.id),
    code: readString(language.code),
    name: readString(language.name),
    targetable: readBoolean(language.targetable),
  };
}

export async function listLanguageTargetOptions({
  adAccountId,
  customerId,
  loginCustomerId: requestedLoginCustomerId,
}: {
  adAccountId: string;
  customerId?: string | null;
  loginCustomerId?: string | null;
}) {
  const adAccount = await findById("google_ad_accounts", adAccountId);
  const resolvedCustomerId =
    normalizeCustomerId(adAccount?.customerId) ||
    normalizeCustomerId(customerId) ||
    normalizeCustomerId(adAccountId);

  const loginCustomerId =
    normalizeCustomerId(requestedLoginCustomerId) ||
    normalizeCustomerId(adAccount?.loginCustomerId) ||
    normalizeCustomerId(adAccount ? await getLoginCustomerIdForAdAccount(adAccountId) : null);

  if (!resolvedCustomerId || !loginCustomerId) {
    return FALLBACK_LANGUAGES;
  }

  const gaql = `
    SELECT
      language_constant.resource_name,
      language_constant.id,
      language_constant.code,
      language_constant.name,
      language_constant.targetable
    FROM language_constant
    WHERE language_constant.targetable = TRUE
    ORDER BY language_constant.name
  `;

  try {
    const payload = await searchGoogleAds(resolvedCustomerId, loginCustomerId, gaql);
    const languages = flattenSearchStream(payload)
      .map(mapLanguage)
      .filter((language): language is LanguageTargetOption => Boolean(language));

    return languages.length ? [FALLBACK_LANGUAGES[0], ...languages] : FALLBACK_LANGUAGES;
  } catch {
    return FALLBACK_LANGUAGES;
  }
}
