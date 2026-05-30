# Apex Nexus

Next.js + MongoDB 多站点广告运营平台 MVP，首期支持 Google Ads Performance Max 和 Demand Gen。

## 能力

- 运营控制台：站点、账号、素材、草稿、投放任务、风控状态。
- 原子 API：账号同步、素材校验、草稿创建、草稿校验、mutate 预览、投放任务、启停、预算、指标。
- Google Ads REST 封装：OAuth refresh token、developer token、`login-customer-id`、`googleAds:mutate`。
- AI 友好：接口返回 `success`、`data`、`error`、`nextActions`，投放任务支持 `idempotencyKey`。
- 默认 dry-run：没有真实 Google Ads 凭证时不会调用外部 API。

## 本地运行

```bash
npm run dev
```

配置真实环境变量时复制 `.env.example` 到 `.env.local`。

## 关键 API

- `POST /api/accounts/sync`
- `GET /api/sites`
- `GET /api/sites/{siteId}/accounts`
- `POST /api/assets`
- `POST /api/assets/validate`
- `POST /api/campaign-drafts`
- `POST /api/campaign-drafts/{id}/validate`
- `POST /api/campaign-drafts/{id}/build-preview`
- `POST /api/launch-jobs`
- `GET /api/launch-jobs/{id}`
- `POST /api/campaigns/{id}/enable`
- `POST /api/campaigns/{id}/pause`
- `POST /api/campaigns/{id}/budget`
- `GET /api/campaigns/{id}/metrics`

## Google Ads 账号规则

平台内部按站点找到操作 MCC，再从操作 MCC 下选择真实投放账号。

- Google Ads URL `customers/{customerId}` 使用真实投放账号。
- Header `login-customer-id` 使用能代管该真实账号的操作 MCC。
- 凭证和 developer token 只从环境变量或服务端密钥读取，不允许由 AI 或运营入参传入。
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
