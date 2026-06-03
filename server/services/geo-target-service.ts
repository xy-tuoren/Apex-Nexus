import { findById } from "@/server/repositories/data-store";
import { searchGoogleAds } from "@/server/google-ads/client";
import { getLoginCustomerIdForAdAccount } from "@/server/services/account-service";
import { POPULAR_COUNTRY_GEO_TARGET_OPTIONS } from "@/lib/google-ads/popular-geo-targets";

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

const FALLBACK_GEO_TARGETS: GeoTargetOption[] = POPULAR_COUNTRY_GEO_TARGET_OPTIONS;

function readString(value: unknown) {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function readField(target: Record<string, unknown>, camelCase: string, snakeCase: string) {
  return readString(target[camelCase] ?? target[snakeCase]);
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
  const resourceName = readField(target, "resourceName", "resource_name");

  if (!resourceName) {
    return null;
  }

  return {
    resourceName,
    id: readString(target.id),
    name: readString(target.name),
    canonicalName: readField(target, "canonicalName", "canonical_name"),
    countryCode: readField(target, "countryCode", "country_code"),
    targetType: readField(target, "targetType", "target_type"),
    status: readString(target.status),
  };
}

function mergeGeoTargets(...targetGroups: GeoTargetOption[][]) {
  const targetsByResourceName = new Map<string, GeoTargetOption>();
  for (const target of targetGroups.flat()) {
    targetsByResourceName.set(target.resourceName, target);
  }
  return [...targetsByResourceName.values()];
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
  if (!normalizedQuery) {
    return FALLBACK_GEO_TARGETS;
  }

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
      AND geo_target_constant.target_type = 'Country'
      ${queryFilter}
    ORDER BY geo_target_constant.name
    LIMIT 100
  `;

  try {
    const payload = await searchGoogleAds(resolvedCustomerId, loginCustomerId, gaql);
    const targets = flattenSearchStream(payload)
      .map(mapGeoTarget)
      .filter((target): target is GeoTargetOption => {
        return target !== null && target.targetType === "Country";
      });

    return targets.length ? mergeGeoTargets(FALLBACK_GEO_TARGETS, targets) : FALLBACK_GEO_TARGETS;
  } catch {
    return FALLBACK_GEO_TARGETS;
  }
}
