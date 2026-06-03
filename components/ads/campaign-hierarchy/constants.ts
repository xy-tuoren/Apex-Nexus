import type { ComboboxOption } from "@/components/ui/combobox";
import type {
  BiddingType,
  ClickBiddingType,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";

export const inputGridClassName = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

export const OS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iOS" },
  { value: "WINDOWS", label: "Windows" },
  { value: "MAC_OS", label: "macOS" },
  { value: "CHROME_OS", label: "ChromeOS" },
];

export const DEVICE_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "DESKTOP", label: "桌面" },
  { value: "MOBILE", label: "移动" },
  { value: "TABLET", label: "平板" },
  { value: "CONNECTED_TV", label: "电视" },
];

export const OS_SELECTABLE_VALUES = OS_OPTIONS.filter((option) => option.value !== "all").map(
  (option) => option.value,
);
export const DEVICE_SELECTABLE_VALUES = DEVICE_OPTIONS.filter((option) => option.value !== "all").map(
  (option) => option.value,
);
export const DEFAULT_OS_SELECTION = [...OS_SELECTABLE_VALUES];
export const DEFAULT_DEVICES_SELECTION = DEVICE_SELECTABLE_VALUES.filter(
  (value) => value !== "CONNECTED_TV",
);

export const OS_COMBOBOX_OPTIONS: ComboboxOption[] = OS_OPTIONS.filter(
  (option) => option.value !== "all",
).map((option) => ({ value: option.value, label: option.label }));

export const DEVICE_COMBOBOX_OPTIONS: ComboboxOption[] = DEVICE_OPTIONS.filter(
  (option) => option.value !== "all",
).map((option) => ({ value: option.value, label: option.label }));

export const GENDER_OPTIONS = [
  { value: "FEMALE", label: "女" },
  { value: "MALE", label: "男" },
  { value: "UNDETERMINED", label: "未知" },
];

export const AGE_OPTIONS = [
  { value: "18", label: "18" },
  { value: "25", label: "25" },
  { value: "35", label: "35" },
  { value: "45", label: "45" },
  { value: "55", label: "55" },
  { value: "65", label: "65 岁以上" },
];

export const FALLBACK_GEO_TARGET_OPTIONS: GeoTargetOption[] = [
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

export const FALLBACK_LANGUAGE_OPTIONS: LanguageTargetOption[] = [
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

export const BIDDING_TYPE_OPTIONS: { value: BiddingType; label: string }[] = [
  { value: "MAXIMIZE_CONVERSIONS", label: "尽可能提高转化次数" },
];

export const CLICK_BIDDING_TYPE_OPTIONS: { value: ClickBiddingType; label: string }[] = [
  { value: "MAX_CPC", label: "目标 CPC" },
  { value: "MAXIMIZE_CLICKS", label: "尽可能提高点击次数" },
];

export const CONVERSION_CATEGORY_LABELS: Record<string, string> = {
  PURCHASE: "购买",
  ADD_TO_CART: "加入购物车",
  BEGIN_CHECKOUT: "开始结账",
  SUBSCRIBE: "订阅",
  SUBMIT_LEAD_FORM: "提交潜在客户表单",
  BOOK_APPOINTMENT: "预约",
  REQUEST_QUOTE: "请求报价",
  GET_DIRECTIONS: "获取路线",
  OUTBOUND_CLICK: "出站点击",
  CONTACT: "联系",
  ENGAGEMENT: "互动",
  PAGE_VIEW: "页面浏览",
  SIGNUP: "注册",
  DOWNLOAD: "下载",
};

export const CTA_OPTIONS = [
  ["AUTO", "（自动）"],
  ["APPLY_NOW", "立即申请"],
  ["BOOK_NOW", "立即预订"],
  ["BUY_NOW", "立即购买"],
  ["CONTACT_US", "联系我们"],
  ["DONATE_NOW", "立即捐款"],
  ["DOWNLOAD", "下载"],
  ["GET_QUOTE", "获取报价"],
  ["LEARN_MORE", "了解详情"],
  ["ORDER_NOW", "立即订购"],
  ["PLAY_NOW", "立即播放"],
  ["SEE_MORE", "查看详细信息"],
  ["SHOP_NOW", "立即选购"],
  ["SIGN_UP", "注册"],
  ["START_NOW", "立即开始"],
  ["SUBSCRIBE", "订阅"],
  ["VISIT_SITE", "访问网站"],
  ["WATCH_NOW", "立即观看"],
];

export const OBJECTIVE_OPTIONS = [
  { value: "CONVERSIONS", label: "转化" },
  { value: "CLICKS", label: "点击次数" },
];

export const DEFAULT_CHANNELS = {
  youtubeInFeed: true,
  youtubeInStream: true,
  youtubeShorts: true,
  discover: true,
  gmail: true,
  display: true,
};

export const SCHEDULE_DAYS = [
  { key: "MONDAY", label: "周一" },
  { key: "TUESDAY", label: "周二" },
  { key: "WEDNESDAY", label: "周三" },
  { key: "THURSDAY", label: "周四" },
  { key: "FRIDAY", label: "周五" },
  { key: "SATURDAY", label: "周六" },
  { key: "SUNDAY", label: "周日" },
];

export const SCHEDULE_HOURS = Array.from({ length: 24 }, (_, index) => index);


