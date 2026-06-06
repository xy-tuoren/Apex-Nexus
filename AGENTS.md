## 原则

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Agent Skills

Skills 统一维护在 `.agents/skills/`（跨 Cursor、Claude Code 等工具的单一来源）。

- 安装或更新 skill 时，只写入 `.agents/skills/<skill-name>/SKILL.md`
- 运行 `./scripts/link-agent-skills.sh` 后：
  - `.cursor/skills` → `.agents/skills`
  - `.claude/skills` → `.agents/skills`

### 已安装

| Skill | 用途 |
|-------|------|
| `frontend-design` | 修改 UI 样式时使用 |
| `next-best-practices` | 修改 Next.js 代码时使用 |
| `next-upgrade` | 升级 Next.js 版本时使用 |

## Next.js

修改 Next.js 代码前，读取并遵循以下 skills：

- `.agents/skills/vercel-react-best-practices/SKILL.md` — Next.js 最佳实践（文件约定、RSC 边界、数据模式、异步 API、metadata、错误处理、Route Handlers、图片/字体优化、打包）
- `.agents/skills/next-upgrade/SKILL.md` — Next.js 版本升级（迁移指南和 codemods）

## 样式

修改 UI 样式时，读取并遵循 `.agents/skills/frontend-design/SKILL.md`。

## UI 组件

当前项目采用 **shadcn/ui 组件体系**：

- 共享组件源码通过 shadcn CLI 下载到项目中维护，当前 shadcn v4 组件底层以 `@base-ui/react`、`cmdk`、`vaul`、`sonner` 等为主；不要直接新增 `@radix-ui/*` 作为项目依赖，除非先说明原因并获得确认。
- 样式使用 Tailwind CSS + `class-variance-authority`
- 共享 UI 组件统一放在 `components/ui/`
- 业务页面只组合共享组件和业务数据，不在页面内从零实现通用交互控件

构建或修改交互/UI 时，按以下顺序决策：

1. **先用 `components/ui`** — Button、Input、Textarea、Select、Checkbox、RadioGroup、Dialog、Sheet、Drawer、Table、Tabs、Tooltip、Separator、ScrollArea、Toast、Badge、Tag 等已有组件必须优先复用。
2. **缺组件先用 shadcn CLI 下载** — 如果 `components/ui` 没有需要的通用组件，先查 shadcn 是否提供，并使用 CLI 把组件源码下载进项目，例如：
   - 单个组件：`npx shadcn@latest add <component-name> -y`
   - 多个组件：`npx shadcn@latest add command popover calendar -y`
   - 覆盖修复已有组件：`npx shadcn@latest add <component-name> -y --overwrite`
   下载后再按项目视觉规范做小范围样式调整。不要在业务目录临时手写 Drawer、Table、Select、Combobox、Upload、Toast、Tooltip、Popover 等通用控件。
3. **业务组件只做组合** — `app/`、`components/ads/` 等业务目录不要内联完整通用控件实现，也不要复制粘贴一大段临时 Tailwind 样式来模拟已有组件。
4. **表格使用 `components/ui/table`** — 后台列表优先使用 `Table` 系列组件；需要排序、筛选、分页时在业务层组合状态，不要随意引入新的表格库。
5. **只有 shadcn 没有时才自建共享组件** — 确认 shadcn registry 没有对应组件后，才允许在 `components/ui/` 新增共享组件；新增时必须复用现有 `Button/Input/Popover/Dialog/Sheet/Table/Badge` 等基础组件，并保持 API、尺寸、圆角、颜色、焦点态与已有组件一致。

## Google Ads API

修改 Google Ads Campaign / AdGroup / Ad 创建、批量 mutate、conversion goal、资源依赖或临时 resource name 相关代码前，优先参考官方文档：

- Mutate requests: https://developers.google.com/google-ads/api/rest/common/mutate
- Bulk mutates: https://developers.google.com/google-ads/api/docs/mutating/bulk-mutate
- Mutate operation limits / quotas: https://developers.google.cn/google-ads/api/docs/best-practices/quotas

注意：

- `googleAds:mutate` 可在同一 `customerId` 下提交多个 `mutateOperations`
- 同一请求内可用负数临时 resource name 串联 budget、campaign、ad group、asset、ad
- 多个 Google Ads 子账号需要按 `customerId` 分组，不能混在同一个 mutate 请求里
- 批量创建前要确认失败策略：整批事务、partial failure、还是逐 campaign 独立提交
