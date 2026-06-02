import { findById } from "@/server/repositories/data-store";
import { searchGoogleAds } from "@/server/google-ads/client";
import { getLoginCustomerIdForAdAccount } from "@/server/services/account-service";

type GoogleAdsSearchChunk = {
  results?: GoogleAdsRow[];
};

type GoogleAdsRow = {
  geoTargetConstant?: Record<string, unknown>;
};

export type GeoTargetOption = {
  resourceName: string;
  id: string;
  name: string;
  canonicalName: string;
  countryCode: string;
  targetType: string;
  status: string;
};

const FALLBACK_GEO_TARGETS: GeoTargetOption[] = [
  {
    resourceName: "geoTargetConstants/2840",
    id: "2840",
    name: "United States",
    canonicalName: "United States",
    countryCode: "US",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2124",
    id: "2124",
    name: "Canada",
    canonicalName: "Canada",
    countryCode: "CA",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2826",
    id: "2826",
    name: "United Kingdom",
    canonicalName: "United Kingdom",
    countryCode: "GB",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2036",
    id: "2036",
    name: "Australia",
    canonicalName: "Australia",
    countryCode: "AU",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2276",
    id: "2276",
    name: "Germany",
    canonicalName: "Germany",
    countryCode: "DE",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2250",
    id: "2250",
    name: "France",
    canonicalName: "France",
    countryCode: "FR",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2380",
    id: "2380",
    name: "Italy",
    canonicalName: "Italy",
    countryCode: "IT",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2724",
    id: "2724",
    name: "Spain",
    canonicalName: "Spain",
    countryCode: "ES",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2528",
    id: "2528",
    name: "Netherlands",
    canonicalName: "Netherlands",
    countryCode: "NL",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2356",
    id: "2356",
    name: "India",
    canonicalName: "India",
    countryCode: "IN",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2076",
    id: "2076",
    name: "Brazil",
    canonicalName: "Brazil",
    countryCode: "BR",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2484",
    id: "2484",
    name: "Mexico",
    canonicalName: "Mexico",
    countryCode: "MX",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2702",
    id: "2702",
    name: "Singapore",
    canonicalName: "Singapore",
    countryCode: "SG",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2410",
    id: "2410",
    name: "South Korea",
    canonicalName: "South Korea",
    countryCode: "KR",
    targetType: "Country",
    status: "ENABLED",
  },
  {
    resourceName: "geoTargetConstants/2392",
    id: "2392",
    name: "Japan",
    canonicalName: "Japan",
    countryCode: "JP",
    targetType: "Country",
    status: "ENABLED",
  },
];

function readString(value: unknown) {
  return typeof value === "string" ? value : value != null ? String(value) : "";
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

function escapeGaqlString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
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

function mapGeoTarget(row: GoogleAdsRow): GeoTargetOption | null {
  const target = row.geoTargetConstant ?? {};
  const resourceName = readString(target.resourceName);

  if (!resourceName) {
    return null;
  }

  return {
    resourceName,
    id: readString(target.id),
    name: readString(target.name),
    canonicalName: readString(target.canonicalName),
    countryCode: readString(target.countryCode),
    targetType: readString(target.targetType),
    status: readString(target.status),
  };
}

export async function listGeoTargetOptions({
  adAccountId,
  customerId,
  loginCustomerId: requestedLoginCustomerId,
  query = "",
}: {
  adAccountId: string;
  customerId?: string | null;
  loginCustomerId?: string | null;
  query?: string | null;
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
    return FALLBACK_GEO_TARGETS;
  }

  const normalizedQuery = query?.trim();
  const queryFilter = normalizedQuery
    ? ` AND geo_target_constant.name LIKE '%${escapeGaqlString(normalizedQuery)}%'`
    : "";
  const gaql = `
    SELECT
      geo_target_constant.resource_name,
      geo_target_constant.id,
      geo_target_constant.name,
      geo_target_constant.canonical_name,
      geo_target_constant.country_code,
      geo_target_constant.target_type,
      geo_target_constant.status
    FROM geo_target_constant
    WHERE geo_target_constant.status = ENABLED
      ${queryFilter}
    ORDER BY geo_target_constant.name
    LIMIT 80
  `;

  try {
    const payload = await searchGoogleAds(resolvedCustomerId, loginCustomerId, gaql);
    const targets = flattenSearchStream(payload)
      .map(mapGeoTarget)
      .filter((target): target is GeoTargetOption => Boolean(target));

    return targets.length ? targets : FALLBACK_GEO_TARGETS;
  } catch {
    return FALLBACK_GEO_TARGETS;
  }
}
