import { getAccessToken } from "@/server/google-ads/oauth";
import { customerResource } from "@/server/google-ads/resource-names";

export type GoogleAdsMutateRequest = {
  customerId: string;
  loginCustomerId: string;
  mutateOperations: unknown[];
};

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

  if (!response.ok) {
    throw new Error(JSON.stringify(payload));
  }

  return payload;
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
