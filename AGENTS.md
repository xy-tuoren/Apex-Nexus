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
| `next-cache-components` | 使用 Next.js 16 缓存组件时使用 |

## Next.js

修改 Next.js 代码前，读取并遵循以下 skills：

- `.agents/skills/vercel-react-best-practices/SKILL.md` — Next.js 最佳实践（文件约定、RSC 边界、数据模式、异步 API、metadata、错误处理、Route Handlers、图片/字体优化、打包）
- `.agents/skills/next-upgrade/SKILL.md` — Next.js 版本升级（迁移指南和 codemods）

## 样式

修改 UI 样式时，读取并遵循 `.agents/skills/frontend-design/SKILL.md`。

## UI 组件

构建或修改交互/UI 时，按以下顺序决策：

1. **先查 Radix UI** — 需要对话框、下拉、弹出层、勾选、单选、Toast 等能力时，优先使用项目已安装的 `@radix-ui/*`（见 `package.json`）或补充对应官方包，在 Radix 原语之上封装，而不是从零写 DOM + 手写键盘/焦点逻辑。
2. **可复用则封装** — 会在多处使用、或属于设计系统一部分的控件（如多选下拉、表单字段壳层），放到 `components/ui/`（或合适的 `components/` 子目录）统一导出复用。
3. **避免页面内联** — 不要把完整交互组件只写在 `app/`、`components/ads/` 等业务页面里；页面只负责组合与业务数据，通用 UI 留在共享组件层。

