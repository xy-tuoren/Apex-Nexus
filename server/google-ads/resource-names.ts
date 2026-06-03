export function customerResource(customerId: string) {
  return customerId.replaceAll("-", "");
}

export function campaignBudget(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/campaignBudgets/${id}`;
}

export function campaign(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/campaigns/${id}`;
}

export function campaignConversionGoal(
  customerId: string,
  campaignId: string | number,
  category: string,
  origin: string,
) {
  return `customers/${customerResource(customerId)}/campaignConversionGoals/${campaignId}~${category}~${origin}`;
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

export function audience(customerId: string, id: string | number) {
  return `customers/${customerResource(customerId)}/audiences/${id}`;
}

export function adGroupAd(customerId: string, adGroupId: string | number, adId: string | number) {
  return `customers/${customerResource(customerId)}/adGroupAds/${adGroupId}~${adId}`;
}
