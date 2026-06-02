#!/usr/bin/env node
/**
 * 验证 Google Ads 凭证是否可用：
 * 1. Refresh Token + Client ID/Secret → Access Token
 * 2. listAccessibleCustomers
 *
 * 用法: node scripts/test-google-ads-api.mjs
 */

import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    throw new Error(".env.local not found");
  }
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i)] = line.slice(i + 1);
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const clientId = env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_ADS_REFRESH_TOKEN;
  const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;

  for (const [name, value] of Object.entries({
    GOOGLE_ADS_CLIENT_ID: clientId,
    GOOGLE_ADS_CLIENT_SECRET: clientSecret,
    GOOGLE_ADS_REFRESH_TOKEN: refreshToken,
    GOOGLE_ADS_DEVELOPER_TOKEN: developerToken,
  })) {
    if (!value) {
      console.error(`❌ 缺少 ${name}`);
      process.exit(1);
    }
  }

  console.log("Step 1/2: OAuth refresh...");
  const tokenRes = await fetch("https://www.googleapis.com/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const tokenBody = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error(`❌ OAuth 失败 (${tokenRes.status})`);
    console.error(JSON.stringify(tokenBody, null, 2));
    if (tokenBody.error === "invalid_grant") {
      console.error("\n提示: Refresh Token 与当前 Client ID/Secret 不匹配，需重新 OAuth 授权。");
    }
    process.exit(1);
  }
  console.log(`✅ Access Token 获取成功 (expires_in: ${tokenBody.expires_in}s)`);

  console.log("\nStep 2/2: Google Ads listAccessibleCustomers...");
  const adsRes = await fetch(
    "https://googleads.googleapis.com/v24/customers:listAccessibleCustomers",
    {
      headers: {
        Authorization: `Bearer ${tokenBody.access_token}`,
        "developer-token": developerToken,
      },
    },
  );
  const adsBody = await adsRes.json();
  if (!adsRes.ok) {
    console.error(`❌ Google Ads API 失败 (${adsRes.status})`);
    console.error(JSON.stringify(adsBody, null, 2));
    process.exit(1);
  }

  const customers = adsBody.resourceNames ?? [];
  console.log(`✅ 可访问广告账号: ${customers.length} 个`);
  for (const c of customers.slice(0, 20)) {
    console.log(`   ${c}`);
  }
  if (customers.length > 20) {
    console.log(`   ... 另有 ${customers.length - 20} 个`);
  }
}

main().catch((error) => {
  console.error("❌ 网络或脚本错误:", error.message);
  process.exit(1);
});
