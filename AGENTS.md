<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent Skills

Skills 统一维护在 `.agents/skills/`（跨 Cursor、Claude Code 等工具的单一来源）。

- 安装或更新 skill 时，只写入 `.agents/skills/<skill-name>/SKILL.md`
- 运行 `./scripts/link-agent-skills.sh` 后：
  - `.cursor/skills` → `.agents/skills`
  - `.claude/skills` → `.agents/skills`

### 已安装

| Skill | 用途 |
|-------|------|
| `frontend-design` | 在 DESIGN.md 约束内，参考 spacing / motion / composition 提升界面质量 |

## 设计系统

**本项目 UI 以 `docs/DESIGN.md` 为唯一设计规范（硬约束）**。`frontend-design` skill 仅为辅助（软约束），不得覆盖 DESIGN.md 或已有 token。

### 阅读顺序

1. **先读** `docs/DESIGN.md` — 颜色、字体、组件形态、禁忌
2. **再读** `.agents/skills/frontend-design/SKILL.md` — 仅取其排版、动效、留白、层次等实现手法
3. **对照** `app/globals.css` 与 `components/ui/*` — 复用已有变量与组件，不另起一套

### DESIGN.md 管什么（不可违反）

- **颜色**：只用 `app/globals.css` 中的 CSS 变量（`--canvas`、`--ink`、`--hairline` 等）；禁止新增强调色、紫色渐变、霓虹 CTA
- **字体**：Display 用 Cormorant Garamond（300），正文/导航用 Inter（400/500）— skill 中「避免 Inter」**对本项目不适用**
- **组件**：CTA 为墨黑/浅色 pill；卡片用 `feature-card`；徽章用 `badge-pill` 风格
- **氛围**：pastel 渐变 orb 仅作背景装饰，不作按钮/文字色
- **明暗模式**：通过 `data-theme="dark"` 切换；新增样式须兼容 `[data-theme="dark"]` 中已有 token
- **风格基调**：编辑杂志风（off-white 画布 + 暖墨文字 + 克制 CTA），禁止 dev-tools 深色默认风

### frontend-design 管什么（DESIGN 框内可用）

- 区块留白、网格节奏、信息层次
- 入场动画、hover、stagger 等微交互（不引入新颜色）
- 不对称布局、卡片分组等 composition — 不改动 token 与字体选型

### 冲突时

| 话题 | 听谁的 |
|------|--------|
| 颜色 / 字体 / CTA 形态 / 圆角 / 明暗 preset | **DESIGN.md** |
| 间距 / 动效 / 排版层次 / 组件内布局 | frontend-design（在 DESIGN 框内） |
| skill 建议换字体、换风格、加 sharp accent | **忽略**，以 DESIGN.md 为准 |

实现位置：token 在 `app/globals.css`；主题切换在 `lib/theme.ts` 与 `components/theme-*`。
