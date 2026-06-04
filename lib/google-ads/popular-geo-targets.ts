export type PopularCountryGeoTarget = {
  resourceName: string;
  id: string;
  name: string;
  canonicalName: string;
  countryCode: string;
  targetType: "Country";
  status: "ENABLED";
  aliases: string[];
};

export const POPULAR_COUNTRY_GEO_TARGETS: PopularCountryGeoTarget[] = [
  { resourceName: "geoTargetConstants/2840", id: "2840", name: "United States", canonicalName: "United States", countryCode: "US", targetType: "Country", status: "ENABLED", aliases: ["美国", "美", "US", "USA"] },
  { resourceName: "geoTargetConstants/2826", id: "2826", name: "United Kingdom", canonicalName: "United Kingdom", countryCode: "GB", targetType: "Country", status: "ENABLED", aliases: ["英国", "英", "UK", "GB"] },
  { resourceName: "geoTargetConstants/2124", id: "2124", name: "Canada", canonicalName: "Canada", countryCode: "CA", targetType: "Country", status: "ENABLED", aliases: ["加拿大", "加"] },
  { resourceName: "geoTargetConstants/2036", id: "2036", name: "Australia", canonicalName: "Australia", countryCode: "AU", targetType: "Country", status: "ENABLED", aliases: ["澳大利亚", "澳洲", "澳"] },
  { resourceName: "geoTargetConstants/2276", id: "2276", name: "Germany", canonicalName: "Germany", countryCode: "DE", targetType: "Country", status: "ENABLED", aliases: ["德国", "德"] },
  { resourceName: "geoTargetConstants/2250", id: "2250", name: "France", canonicalName: "France", countryCode: "FR", targetType: "Country", status: "ENABLED", aliases: ["法国", "法"] },
  { resourceName: "geoTargetConstants/2380", id: "2380", name: "Italy", canonicalName: "Italy", countryCode: "IT", targetType: "Country", status: "ENABLED", aliases: ["意大利", "意"] },
  { resourceName: "geoTargetConstants/2724", id: "2724", name: "Spain", canonicalName: "Spain", countryCode: "ES", targetType: "Country", status: "ENABLED", aliases: ["西班牙", "西"] },
  { resourceName: "geoTargetConstants/2528", id: "2528", name: "Netherlands", canonicalName: "Netherlands", countryCode: "NL", targetType: "Country", status: "ENABLED", aliases: ["荷兰"] },
  { resourceName: "geoTargetConstants/2356", id: "2356", name: "India", canonicalName: "India", countryCode: "IN", targetType: "Country", status: "ENABLED", aliases: ["印度"] },
  { resourceName: "geoTargetConstants/2076", id: "2076", name: "Brazil", canonicalName: "Brazil", countryCode: "BR", targetType: "Country", status: "ENABLED", aliases: ["巴西"] },
  { resourceName: "geoTargetConstants/2484", id: "2484", name: "Mexico", canonicalName: "Mexico", countryCode: "MX", targetType: "Country", status: "ENABLED", aliases: ["墨西哥"] },
  { resourceName: "geoTargetConstants/2702", id: "2702", name: "Singapore", canonicalName: "Singapore", countryCode: "SG", targetType: "Country", status: "ENABLED", aliases: ["新加坡", "新"] },
  { resourceName: "geoTargetConstants/2410", id: "2410", name: "South Korea", canonicalName: "South Korea", countryCode: "KR", targetType: "Country", status: "ENABLED", aliases: ["韩国", "南韩", "韩"] },
  { resourceName: "geoTargetConstants/2392", id: "2392", name: "Japan", canonicalName: "Japan", countryCode: "JP", targetType: "Country", status: "ENABLED", aliases: ["日本", "日"] },
  { resourceName: "geoTargetConstants/2156", id: "2156", name: "China", canonicalName: "China", countryCode: "CN", targetType: "Country", status: "ENABLED", aliases: ["中国", "大陆"] },
  { resourceName: "geoTargetConstants/2344", id: "2344", name: "Hong Kong", canonicalName: "Hong Kong", countryCode: "HK", targetType: "Country", status: "ENABLED", aliases: ["香港", "港"] },
  { resourceName: "geoTargetConstants/2158", id: "2158", name: "Taiwan", canonicalName: "Taiwan", countryCode: "TW", targetType: "Country", status: "ENABLED", aliases: ["台湾", "台"] },
  { resourceName: "geoTargetConstants/2458", id: "2458", name: "Malaysia", canonicalName: "Malaysia", countryCode: "MY", targetType: "Country", status: "ENABLED", aliases: ["马来西亚", "马来"] },
  { resourceName: "geoTargetConstants/2764", id: "2764", name: "Thailand", canonicalName: "Thailand", countryCode: "TH", targetType: "Country", status: "ENABLED", aliases: ["泰国", "泰"] },
  { resourceName: "geoTargetConstants/2360", id: "2360", name: "Indonesia", canonicalName: "Indonesia", countryCode: "ID", targetType: "Country", status: "ENABLED", aliases: ["印度尼西亚", "印尼"] },
  { resourceName: "geoTargetConstants/2608", id: "2608", name: "Philippines", canonicalName: "Philippines", countryCode: "PH", targetType: "Country", status: "ENABLED", aliases: ["菲律宾"] },
  { resourceName: "geoTargetConstants/2704", id: "2704", name: "Vietnam", canonicalName: "Vietnam", countryCode: "VN", targetType: "Country", status: "ENABLED", aliases: ["越南"] },
  { resourceName: "geoTargetConstants/2784", id: "2784", name: "United Arab Emirates", canonicalName: "United Arab Emirates", countryCode: "AE", targetType: "Country", status: "ENABLED", aliases: ["阿联酋", "迪拜"] },
  { resourceName: "geoTargetConstants/2682", id: "2682", name: "Saudi Arabia", canonicalName: "Saudi Arabia", countryCode: "SA", targetType: "Country", status: "ENABLED", aliases: ["沙特", "沙特阿拉伯"] },
  { resourceName: "geoTargetConstants/2792", id: "2792", name: "Turkey", canonicalName: "Turkey", countryCode: "TR", targetType: "Country", status: "ENABLED", aliases: ["土耳其"] },
  { resourceName: "geoTargetConstants/2616", id: "2616", name: "Poland", canonicalName: "Poland", countryCode: "PL", targetType: "Country", status: "ENABLED", aliases: ["波兰"] },
  { resourceName: "geoTargetConstants/2752", id: "2752", name: "Sweden", canonicalName: "Sweden", countryCode: "SE", targetType: "Country", status: "ENABLED", aliases: ["瑞典"] },
  { resourceName: "geoTargetConstants/2756", id: "2756", name: "Switzerland", canonicalName: "Switzerland", countryCode: "CH", targetType: "Country", status: "ENABLED", aliases: ["瑞士"] },
  { resourceName: "geoTargetConstants/2554", id: "2554", name: "New Zealand", canonicalName: "New Zealand", countryCode: "NZ", targetType: "Country", status: "ENABLED", aliases: ["新西兰"] },
  { resourceName: "geoTargetConstants/2376", id: "2376", name: "Israel", canonicalName: "Israel", countryCode: "IL", targetType: "Country", status: "ENABLED", aliases: ["以色列"] },
  { resourceName: "geoTargetConstants/2710", id: "2710", name: "South Africa", canonicalName: "South Africa", countryCode: "ZA", targetType: "Country", status: "ENABLED", aliases: ["南非"] },
  { resourceName: "geoTargetConstants/2032", id: "2032", name: "Argentina", canonicalName: "Argentina", countryCode: "AR", targetType: "Country", status: "ENABLED", aliases: ["阿根廷"] },
  { resourceName: "geoTargetConstants/2152", id: "2152", name: "Chile", canonicalName: "Chile", countryCode: "CL", targetType: "Country", status: "ENABLED", aliases: ["智利"] },
  { resourceName: "geoTargetConstants/2170", id: "2170", name: "Colombia", canonicalName: "Colombia", countryCode: "CO", targetType: "Country", status: "ENABLED", aliases: ["哥伦比亚"] },
];

export const POPULAR_COUNTRY_GEO_TARGET_OPTIONS = POPULAR_COUNTRY_GEO_TARGETS.map(
  ({ aliases: _aliases, ...target }) => target, // eslint-disable-line @typescript-eslint/no-unused-vars
);
