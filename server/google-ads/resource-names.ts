export function customerResource(customerId: string) {
  return customerId.replaceAll("-", "");
}

export function campaignBudget(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/campaignBudgets/${id}`;
}

export function campaign(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/campaigns/${id}`;
}

export function asset(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/assets/${id}`;
}

export function assetGroup(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/assetGroups/${id}`;
}

export function adGroup(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/adGroups/${id}`;
}

export function adGroupAd(customerId: string, adGroupId: string | number, adId: string | number) {
  return `customers/${customerResource(customerId)}/adGroupAds/${adGroupId}~${adId}`;
}
