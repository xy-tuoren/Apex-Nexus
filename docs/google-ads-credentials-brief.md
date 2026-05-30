# Google Ads 快速投放平台 — 凭证与接入说明

**文档用途**：供管理层了解平台接入 Google Ads 所需凭证、获取方式与组织分工。  
**适用对象**：业务负责人、MCC 管理员、技术负责人  
**更新日期**：2026-05-30

---

## 1. 平台在做什么

我们正在建设一套 **多站点广告运营后台**，目标是把目前分散、手工的 Google Ads 投放流程，变成可标准化、可批量、可审计的平台能力。

**当前已支持：**

- 管理多个站点、多个 MCC、多个真实投放账号
- 通过 API 创建 **Performance Max（效果最大化）** 和 **Demand Gen（需求开发）** 广告
- 运营在后台操作，AI 可通过原子接口辅助投放
- 默认 **暂停态创建**，校验通过后再启用，降低误投风险

**账号结构（示意）：**

```
数据 MCC（顶层）
  ├── 操作 MCC A（站点 A）
  │     ├── 投放账号 A1
  │     └── 投放账号 A2
  └── 操作 MCC B（站点 B）
        └── 投放账号 B1
```

---

## 2. 为什么要这些凭证

Google Ads 不允许任意程序直接操作广告账号。任何系统要代管投放，必须同时证明：

| 证明内容 | 对应凭证 |
|----------|----------|
| 这个 **应用** 被 Google 允许调用 API | Developer Token |
| 这个 **操作者** 有权管理目标广告账号 | OAuth 授权（Refresh Token） |
| 应用身份合法 | Client ID / Client Secret |

**结论**：这不是可选配置，而是 Google 官方的强制要求。缺任何一项，都无法对真实账号进行程序化投放。

---

## 3. 需要准备哪些凭证（共 4 项）

| 序号 | 凭证名称 | 配置位置 | 一句话说明 |
|------|----------|----------|------------|
| 1 | **Developer Token** | 服务端环境变量 | 应用调用 Google Ads API 的「通行证」 |
| 2 | **Client ID** | 服务端环境变量 | Google Cloud 上注册的应用 ID |
| 3 | **Client Secret** | 服务端环境变量 | 与 Client ID 配套的密钥 |
| 4 | **Refresh Token** | 服务端环境变量 | 代表「哪个 Google 账号授权平台代管广告」 |

> **说明**：Access Token 由系统自动刷新，无需人工维护。  
> **说明**：MongoDB 等数据库配置属于平台内部存储，不是 Google 要求项。

---

## 4. 各项凭证由谁、在哪里获取

### 4.1 Developer Token — 开发者令牌

| 项目 | 内容 |
|------|------|
| **谁负责** | MCC 管理员 / 广告账号负责人 |
| **在哪里申请** | [Google Ads API Center](https://ads.google.com/aw/apicenter) |
| **用什么账号** | **数据 MCC（顶层 MCC）经理账号** |
| **审核周期** | 提交后 Google 审核，通常需要数个工作日 |
| **初期权限** | 审核通过前仅可调 **测试账号**；调生产账号需 **Basic / Standard Access** |

**建议**：全公司共用 **一个** Developer Token，由数据 MCC 统一申请，不要每个站点各申请一套。

---

### 4.2 Client ID / Client Secret — OAuth 应用凭据

| 项目 | 内容 |
|------|------|
| **谁负责** | 技术团队 |
| **在哪里创建** | [Google Cloud Console](https://console.cloud.google.com/) |
| **用什么账号** | 任意可管理 Cloud 项目的 Google 账号（**不要求** MCC 账号） |
| **前置条件** | 在 Cloud 项目中启用 **Google Ads API**，并完成 OAuth 同意屏幕配置 |

**建议**：一个平台对应一个 Cloud OAuth 应用即可，由技术团队统一维护。

---

### 4.3 Refresh Token — 刷新令牌

| 项目 | 内容 |
|------|------|
| **谁负责** | MCC 管理员（或对全部目标账号有管理权限的负责人） |
| **如何获取** | 完成一次 OAuth 授权流程（约 10 分钟） |
| **用什么账号** | **对数据 MCC 及下属所有投放账号有管理员权限** 的 Google 账号 |
| **有效期** | 长期有效，除非主动撤销授权 |

**建议**：若要操作 **所有站点、所有投放账号**，应使用 **数据 MCC 超级管理员** 账号完成授权。

---

## 5. 推荐组织分工（操作全部投放账号）

| 角色 | 负责事项 | 是否必须与 Ads 账号同一人 |
|------|----------|---------------------------|
| **MCC 管理员** | 申请 Developer Token；完成 OAuth 授权（Refresh Token） | 建议同体系下的管理员 |
| **技术团队** | 创建 Google Cloud 项目；配置 Client ID / Secret；部署平台 | 否 |
| **运营团队** | 在后台创建广告草稿、审核素材、提交投放 | 否（通过平台权限控制） |

**推荐组合：**

```
Developer Token  →  数据 MCC 申请
Refresh Token    →  数据 MCC 管理员 OAuth 授权
Client ID/Secret →  技术团队在 Google Cloud 创建
```

三者 **不要求** 是同一个 Gmail，但 Refresh Token 对应账号必须对目标广告账号有管理权限。

---

## 6. 安全与合规

| 原则 | 说明 |
|------|------|
| **凭证仅存服务端** | 不写入前端、不暴露给运营或 AI 接口入参 |
| **不提交代码仓库** | 凭证保存在 `.env.local` 或企业密钥管理系统 |
| **默认 Dry Run** | 凭证未配齐时，平台不会调用真实 Google Ads，避免误投 |
| **暂停态创建** | 新广告默认暂停，需人工或审批后启用 |
| **审计日志** | 平台记录创建、启停、改预算等操作 |
| **泄露处理** | Refresh Token 一旦泄露，立即撤销授权并重新生成 |

---

## 7. 接入进度与里程碑

| 阶段 | 内容 | 依赖 |
|------|------|------|
| **阶段 1** | 平台本地运行，Dry Run 模拟投放 | 无（已完成） |
| **阶段 2** | 配齐 4 项凭证，验证可访问账号列表 | MCC 管理员 + 技术团队 |
| **阶段 3** | 测试账号上创建 PMax / Demand Gen | Developer Token（Test 权限即可） |
| **阶段 4** | 生产账号正式投放 | Developer Token 升级为 Basic/Standard |
| **阶段 5** | 多站点批量投放、报表、AI 自动化 | 平台功能迭代 |

---

## 8. 当前状态（待办）

| 凭证 | 状态 |
|------|------|
| Refresh Token | 已取得，已配置到开发环境 |
| Developer Token | **待 MCC 管理员在 API Center 申请** |
| Client ID / Secret | **待技术团队在 Google Cloud 创建** |
| 生产 API 权限 | **待 Google 审核 Developer Token 访问级别** |

**下一步行动：**

1. **MCC 管理员**：登录 API Center 提交 Developer Token 申请（建议用数据 MCC）
2. **技术团队**：创建 Google Cloud OAuth 应用，提供 Client ID / Secret
3. **MCC 管理员**：用管理员账号完成 OAuth 授权，确认 Refresh Token 有效
4. **技术团队**：配齐凭证后关闭 Dry Run，做测试账号验证
5. **业务团队**：确认测试通过后，申请生产 API 访问级别

---

## 9. 常见问题（管理层版）

**Q：能不能不用这些凭证，直接在后台手工投？**  
A：可以手工投，但无法实现批量、标准化、AI 辅助和审计。API 凭证是程序化投放的前提。

**Q：每个站点都要一套凭证吗？**  
A：不需要。一套凭证 + 平台内按站点配置 MCC 和投放账号即可。

**Q：Developer Token 和 Refresh Token 必须是同一个账号吗？**  
A：不需要。但 Refresh Token 必须是能管理目标广告账号的管理员。

**Q：审核要多久？**  
A：Developer Token 审核通常数个工作日；OAuth 和 Cloud 配置可在当天完成。

**Q：有什么风险？**  
A：主要风险是凭证泄露和误投。平台已通过 Dry Run、暂停态创建、权限隔离和审计日志降低风险。

---

## 10. 附录：技术验证命令（供技术团队使用）

凭证配齐后，可用以下命令验证是否生效：

```bash
# 1. 列出 OAuth 用户可访问的广告账号
curl -H "Authorization: Bearer {ACCESS_TOKEN}" \
     -H "developer-token: {DEVELOPER_TOKEN}" \
     https://googleads.googleapis.com/v24/customers:listAccessibleCustomers

# 2. 调用平台接口
curl http://localhost:3000/api/sites
curl -X POST http://localhost:3000/api/accounts/sync
```

---

## 11. 参考链接

- [Google Ads API — OAuth 概览](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=zh-cn)
- [Google Ads API — 获取 Developer Token](https://developers.google.com/google-ads/api/docs/get-started/dev-token?hl=zh-cn)
- [Google Ads API — REST 授权说明](https://developers.google.com/google-ads/api/docs/rest/auth?hl=zh-cn)
- [Google Ads API Center](https://ads.google.com/aw/apicenter)

---

**文档维护**：技术团队  
**如有疑问**：请联系 MCC 管理员（凭证与权限）或技术负责人（平台部署）
