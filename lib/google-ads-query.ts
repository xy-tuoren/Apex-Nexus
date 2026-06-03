import type { GoogleAdAccount, GoogleMccAccount } from "@/lib/types";

/**
 * Build URLSearchParams for Google Ads account API calls.
 * Extracts customerId and loginCustomerId from the account and its MCC chain.
 */
export function buildAccountQueryParams(
  adAccountId: string,
  adAccounts: GoogleAdAccount[],
  mccAccounts: GoogleMccAccount[],
): URLSearchParams {
  const params = new URLSearchParams();
  const account = adAccounts.find((item) => item.id === adAccountId);

  if (account?.customerId) {
    params.set("customerId", account.customerId);
  }

  const accountLoginCustomerId =
    account?.loginCustomerId ??
    mccAccounts.find((mcc) => mcc.id === account?.operationMccId)?.customerId;

  if (accountLoginCustomerId) {
    params.set("loginCustomerId", accountLoginCustomerId);
  }

  return params;
}