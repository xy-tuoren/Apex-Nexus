# Google Ads API 配额与限流说明

**文档用途**：团队参考 Google Ads API 各类配额、限流机制及与本项目相关的消耗估算。  
**更新日期**：2026-06-01  
**官方文档**：

- [API Limits and Quotas](https://developers.google.com/google-ads/api/docs/best-practices/quotas)
- [Access Levels](https://developers.google.com/google-ads/api/docs/api-policy/access-levels)
- [Rate Limits](https://developers.google.com/google-ads/api/docs/productionize/rate-limits)

---

## 1. 两类限制（不要混淆）

| 类型 | 含义 | 典型错误 | 是否有固定数字 |
|------|------|----------|----------------|
| **日操作配额** | 过去 24 小时内 Developer Token 发起的 API operation 总数 | `RESOURCE_EXHAUSTED`，`rateName: Number of operations for explorer access` | ✅ 有 |
| **系统速率限制** | 秒级/小时级 QPS、并发、服务端负载 | `RESOURCE_TEMPORARILY_EXHAUSTED` | ❌ 无固定值 |

日配额用尽时，响应可能包含 `retryDelay`（如 `8962s`），表示大约还需等待多久，滚动窗口才会空出额度。

---

## 2. Access Level 与日操作配额

统计单位：**API operations**（见第 3 节）。

| Access Level | 可访问账号 | 生产账号（production） | 测试账号（test） | 刷新方式 |
|--------------|------------|------------------------|------------------|----------|
| **Test Account Access** | 仅测试账号 | 0（不能调生产） | **15,000 / 天** | 滚动 24h |
| **Explorer Access** | 测试 + 生产 | **2,880 / 天** | **15,000 / 天** | 滚动 24h |
| **Basic Access** | 测试 + 生产 | **15,000 / 天** | **15,000 / 天** | 滚动 24h |
| **Standard Access** | 测试 + 生产 | **基本不限**（多数服务） | **基本不限** | 仍有服务级例外 |

### 刷新机制

- **「/ 天」= 滚动 24 小时窗口**，不是 UTC 0 点或固定时刻重置。
- 每过一分钟，约 24 小时前的 operation 从窗口滑出，配额逐步恢复。
- 生产 vs 测试**分开计数**：调生产账号消耗生产配额；调测试账号消耗测试配额。

### Explorer Access 额外限制

Explorer 无法使用部分功能（需 Basic/Standard），包括：

- 账号创建（`CustomerService.CreateCustomerClient`）
- 用户管理（`CustomerUserAccess*`）
- 关键词规划、Audience Insights、Reach Plan 等 Planning 类服务
- 账单与支付相关服务

申请升级：[Google Ads API Center](https://ads.google.com/aw/apicenter)（Basic 约 2 个工作日，Standard 约 10 个工作日）。

---

## 3. 什么算 1 次 operation

| 请求类型 | 计几次 |
|----------|--------|
| `Search` | **1 次** |
| `SearchStream` | **1 次**（不论返回多少 batch） |
| `Mutate`（整次 HTTP 请求） | **1 次**（请求内 mutate operation 数量另有上限，见第 4 节） |
| 其他非 Get / Mutate / Search / SearchStream 的请求 | **1 次** |
| 带**有效** `next_page_token` 的分页续请求 | **不计入** |
| 带过期/无效 page token 的分页 | **计入** |
| 返回 `GoogleAdsFailure` 的失败请求 | **仍计入** |
| 网络层失败、请求未到达服务端 | **不计入** |

### 本项目常见调用

| 调用 | 每次消耗 |
|------|----------|
| `customers:listAccessibleCustomers` | 1 operation |
| `googleAds:searchStream` | 1 operation |
| `googleAds:mutate` | 1 operation |

---

## 4. 单次请求内的硬性上限

与「日 operation 配额」无关，属于单次请求或服务级限制。

| 限制项 | 上限 | 超限错误 |
|--------|------|----------|
| 单次 `Mutate` 内的 mutate operations | **10,000** | `TOO_MANY_MUTATE_OPERATIONS` |
| 单次请求内的 action operations | **100** | `TOO_MANY_ACTION_OPERATIONS` |
| gRPC 响应体大小（客户端库默认） | **64 MB** | gRPC `429 Resource Exhausted` |
| GAQL `IN` 子句元素数 | **20,000** | `FILTER_HAS_TOO_MANY_VALUES` |
| 转化上传（单次请求） | **2,000** 条 | `TOO_MANY_CONVERSIONS_IN_REQUEST` |
| Conversion adjustment（单次请求） | **2,000** 条 | `TOO_MANY_ADJUSTMENTS_IN_REQUEST` |
| Billing / Account Budget 单次 mutate | **1** 个 operation | `TOO_MANY_MUTATE_OPERATIONS` |
| 同一账号预算变更间隔 | 建议 **≥ 12 小时** | 可能不可恢复失败 |
| 每账号 conversion value rules | **100,000** | `ACCOUNT_LIMIT` |

---

## 5. 系统速率限制（QPS / 小时）

**与日配额独立**，所有 Access Level 均适用。

| 维度 | 说明 |
|------|------|
| 计量对象 | **Developer Token** 与 **Client Customer ID (CID)** **分别**限流 |
| 算法 | Token Bucket，上限随服务端实时负载变化 |
| 固定 QPS / 小时数字 | **官方不公布** |
| 典型触发原因 | 并发过高、短时间 burst、多进程/多机器共用同一 Token |
| 错误码 | 多为 `RESOURCE_TEMPORARILY_EXHAUSTED` |

### 官方建议

- 控制全局并发（跨进程、跨机器合计）
- 客户端 QPS 限流（Token Bucket）
- Mutate 批量合并，减少请求次数
- 遇限流使用指数退避重试

> 社区非官方经验：约 3 QPS 长期稳定，**不能当作官方保证**。

---

## 6. 有明确数字的服务级配额

### Keyword Planning

| 方法 | 限制 |
|------|------|
| `GenerateKeywordIdeas` / `GenerateKeywordHistoricalMetrics` / `GenerateKeywordForecastMetrics` | **1 QPS / CID**（= 60 次 / 60 秒） |
| `GenerateAdGroupTheme` | **2 QPS / CID** |
| Planning Service（整体） | **1 QPS** |

Keyword Plan 对象数量：

| 对象 | 上限 |
|------|------|
| `KeywordPlan` / 账号 | 10,000 |
| `KeywordPlanAdGroup` / Plan | 200 |
| `KeywordPlanAdGroupKeyword` / Plan | 10,000 |
| `KeywordPlanCampaignKeyword` | 1,000 |
| `KeywordPlanCampaign` / Plan | 1 |

### Audience Insights

| 方法 | 限制 |
|------|------|
| `GenerateAudienceCompositionInsights` / `GenerateSuggestedTargetingInsights` | **~200 次 / 天 / CID** |
| `GenerateTargetingSuggestionMetrics` | **2 QPS / Developer Token** |

### User Data

| 限制 | 数字 |
|------|------|
| 单个 `UserData` 的 `user_identifiers` | 20 |
| 单个 `OfflineUserDataJob` 总 identifiers | 100,000 |

---

## 7. 错误码对照

| HTTP | gRPC / Status | 含义 | 处理 |
|------|---------------|------|------|
| 429 | `RESOURCE_EXHAUSTED` | 日 operation 配额或部分服务硬配额用尽 | 等待 `retryDelay`；减少调用；申请 Basic/Standard |
| 429 | `RESOURCE_TEMPORARILY_EXHAUSTED` | 短期 QPS / 并发 / 服务端负载 | 指数退避；降低并发 |
| — | `TOO_MANY_MUTATE_OPERATIONS` | 单次 Mutate 内 operation 过多 | 拆分请求 |
| — | `TOO_MANY_CONVERSIONS_IN_REQUEST` | 单次转化上传过多 | 分批上传 |

### 示例：Explorer 日配额用尽

```json
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. check quota).",
    "status": "RESOURCE_EXHAUSTED",
    "details": [{
      "errors": [{
        "errorCode": { "quotaError": "RESOURCE_EXHAUSTED" },
        "message": "Too many requests. Retry in 8962 seconds.",
        "details": {
          "quotaErrorDetails": {
            "rateScope": "DEVELOPER",
            "rateName": "Number of operations for explorer access",
            "retryDelay": "8962s"
          }
        }
      }]
    }]
  }
}
```

---

## 8. 与本项目相关的消耗估算

账号同步逻辑见 `server/google-ads/account-discovery.ts` 的 `discoverGoogleAdsAccounts()`。

一次完整同步大致包括：

```
1  (listAccessibleCustomers)
+ N  (每个 accessible customer 查 profile，searchStream)
+ M  (每个 MCC 查 customer_client，searchStream)
+ K  (每个子账号再查 profile，searchStream)
```

打开 `/ads` 页面会自动触发同步；若 MCC 层级深、子账号多，**一次同步可能消耗几十到上百次 operation**。

### Explorer + 生产账号粗算

- 上限：**2,880 次 / 滚动 24h**
- 平均：**约 2 次/分钟**（滚动窗口，非匀速发放）
- 开发阶段反复刷新、多人共用同一 Developer Token，几小时内即可打满

### 建议

1. **短期**：配额恢复前避免重复同步；使用已缓存/已入库的账号数据。
2. **中期**：对同步结果做 TTL 缓存，页面加载不每次都全量拉 API。
3. **长期**：在 API Center 申请 **Basic Access**（15,000/天）或 **Standard Access**（基本不限）。

---

## 9. 速查表

| 层级 | Explorer 生产账号 |
|------|-------------------|
| 日 operation 配额 | **2,880 / 滚动 24h** |
| 小时 operation | 动态，无数值 |
| QPS（Token + CID） | 动态 Token Bucket，无数值 |
| 单次 Mutate operations | 最多 **10,000** |
| 每次 SearchStream | **1 operation** |
