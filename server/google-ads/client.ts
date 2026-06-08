import { getAccessToken } from "@/server/google-ads/oauth";
import { customerResource } from "@/server/google-ads/resource-names";

export type GoogleAdsMutateRequest = {
  customerId: string;
  loginCustomerId: string;
  mutateOperations: unknown[];
};

const CONCURRENT_MODIFICATION_MAX_ATTEMPTS = 4;
const CONCURRENT_MODIFICATION_BASE_DELAY_MS = 750;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasConcurrentModification(value: unknown): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === "string") {
    return value.includes("CONCURRENT_MODIFICATION");
  }

  if (Array.isArray(value)) {
    return value.some(hasConcurrentModification);
  }

  if (typeof value === "object") {
    return Object.values(value).some(hasConcurrentModification);
  }

  return false;
}

export async function mutateGoogleAds(request: GoogleAdsMutateRequest) {
  const dryRun = process.env.GOOGLE_ADS_DRY_RUN !== "false";
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const accessToken = await getAccessToken();

  if (dryRun || !developerToken || !accessToken) {
    return {
      dryRun: true,
      request,
      mutateOperationResponses: request.mutateOperations.map((_, index) => ({
        operationIndex: index,
        resourceName: `dryRun/resource/${index + 1}`,
      })),
    };
  }

  for (let attempt = 1; attempt <= CONCURRENT_MODIFICATION_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(
      `https://googleads.googleapis.com/v24/customers/${customerResource(
        request.customerId,
      )}/googleAds:mutate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          "login-customer-id": customerResource(request.loginCustomerId),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mutateOperations: request.mutateOperations }),
      },
    );

    const payload = await response.json();

    if (response.ok) {
      return payload;
    }

    if (
      attempt < CONCURRENT_MODIFICATION_MAX_ATTEMPTS &&
      hasConcurrentModification(payload)
    ) {
      await sleep(CONCURRENT_MODIFICATION_BASE_DELAY_MS * 2 ** (attempt - 1));
      continue;
    }

    throw new Error(JSON.stringify(payload));
  }

  throw new Error("Google Ads mutate retry attempts exhausted.");
}

export async function searchGoogleAds(customerId: string, loginCustomerId: string, query: string) {
  const dryRun = process.env.GOOGLE_ADS_DRY_RUN !== "false";
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const accessToken = await getAccessToken();

  if (dryRun || !developerToken || !accessToken) {
    return {
      dryRun: true,
      query,
      results: [],
    };
  }

  const response = await fetch(
    `https://googleads.googleapis.com/v24/customers/${customerResource(
      customerId,
    )}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": customerResource(loginCustomerId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(payload));
  }

  return payload;
}
