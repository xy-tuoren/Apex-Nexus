import type { ComboboxOption } from "@/components/ui/combobox";
import { POPULAR_COUNTRY_GEO_TARGET_OPTIONS } from "@/lib/google-ads/popular-geo-targets";
import type {
  BiddingType,
  ClickBiddingType,
  GeoTargetOption,
  LanguageTargetOption,
} from "@/components/ads/campaign-hierarchy/types";

export const inputGridClassName = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
export const editorFormCardClassName = "rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)] sm:p-5";
export const editorFormStackClassName = "grid gap-4";
export const editorFormSectionStackClassName = "grid gap-5";
export const editorFormFieldRowClassName = "flex flex-wrap gap-4 [&>.field]:flex-1 [&>.field]:min-w-[220px]";

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
  { value: "18", label: "18-24" },
  { value: "25", label: "25-34" },
  { value: "35", label: "35-44" },
  { value: "45", label: "45-54" },
  { value: "55", label: "55-64" },
  { value: "65", label: "65+" },
];

export const FALLBACK_GEO_TARGET_OPTIONS: GeoTargetOption[] = [
  ...POPULAR_COUNTRY_GEO_TARGET_OPTIONS,
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
  { value: "TARGET_CPA", label: "目标 CPA" },
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
