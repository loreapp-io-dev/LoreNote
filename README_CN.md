<div align="center">

<img src="logo.png" alt="LoreNote Logo" width="120" />

# LoreNote

### JSON 驱动的笔记应用

**"组件即页面，页面即组件"**

[![Version](https://img.shields.io/badge/version-0.2.0--beta-blue.svg)]()
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)]()
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)

中文 | **[English](README.md)**

<br/>

<img src="display1.png" alt="LoreNote Screenshot 1" width="80%" />

<br/><br/>

<img src="display2.png" alt="LoreNote Screenshot 2" width="80%" />

</div>

---

## 关于

LoreNote 是一款现代桌面笔记应用，采用独特设计：**每个块都由 JSON Schema 定义，而非硬编码组件**。

> *灵感源自 Notion 的块编辑器和 Obsidian 的本地优先理念，采用现代 Web 技术构建。*

---

## 核心理念：JSON 组件化

### 传统笔记应用的问题

```tsx
// ❌ 传统方式：每个组件都需要开发者写代码
function TableBlock({ data }) {
  return (
    <table>
      {data.rows.map(row => (
        <tr key={row.id}>
          {row.cells.map(cell => (
            <td key={cell.id}>{cell.content}</td>
          ))}
        </tr>
      ))}
    </table>
  )
}

// 想要新组件？等开发者更新版本吧...
```

### LoreNote 的解决方案

```json
{
  "element": "table",
  "data": { "rows": [...], "hasHeader": true },
  "children": [{
    "element": "tr",
    "loop": { "items": "data.rows", "itemName": "row" },
    "children": [{
      "element": "td",
      "loop": { "items": "row.cells", "itemName": "cell" },
      "props": { "contentEditable": true },
      "events": { "input": "data.rows[rowIndex].cells[cellIndex].content = event.target.innerText" },
      "children": ["${cell.content}"]
    }]
  }]
}
```

**零 TSX。纯 JSON。完整交互。**

---

## 为什么这很重要？

### 1. 无限扩展性

| 传统应用 | LoreNote |
|---------|----------|
| 组件由开发团队决定 | 用户自己定义组件 |
| 新功能等版本更新 | 写个 JSON 立即可用 |
| 代码能力门槛高 | 只需理解 JSON 结构 |

### 2. 社区创作生态

```
用户 A 创建了「习惯追踪器」组件
    ↓
导出为 habit-tracker.json (仅 2KB)
    ↓
分享到社区 / 发送给朋友
    ↓
用户 B 导入，立即可用
    ↓
用户 B 修改样式，创建自己的版本
```

**不需要安装插件。不需要等待审核。不需要写代码。**

### 3. AI 友好

```
用户：帮我创建一个项目进度追踪组件

AI：好的，这是组件 JSON...
{
  "element": "div",
  "data": { "tasks": [], "progress": 0 },
  ...
}

用户：复制 → 粘贴 → 完成
```

**JSON 是 AI 最擅长生成的格式。** 未来 LoreNote 将深度集成 AI 工作流，让组件创作更加简单。

### 4. 完整的交互能力

JSON Schema 不是简化版，它支持完整的交互逻辑：

| 能力 | 示例 |
|------|------|
| 数据绑定 | `${data.title}` |
| 条件渲染 | `"condition": "data.count > 0"` |
| 循环渲染 | `"loop": { "items": "data.list" }` |
| 事件处理 | `"events": { "click": "data.count++" }` |
| 计算表达式 | `${data.items.reduce((s,i) => s + i.price, 0)}` |
| 条件样式 | `"conditional": [{ "condition": "...", "className": "..." }]` |

---

## 技术栈

<table>
<tr>
<td align="center" width="100">
<strong>React 19</strong><br/>前端
</td>
<td align="center" width="100">
<strong>Tauri 2</strong><br/>桌面端
</td>
<td align="center" width="100">
<strong>Tailwind 4</strong><br/>样式
</td>
<td align="center" width="100">
<strong>Shadcn UI</strong><br/>组件库
</td>
<td align="center" width="100">
<strong>Zustand</strong><br/>状态管理
</td>
</tr>
</table>

---

## 功能

### v0.2.0-beta（当前版本）

<details open>
<summary><strong>核心功能</strong></summary>

| 功能 | 说明 |
|------|------|
| 仓库系统 | 多仓库支持，元数据管理 |
| 页面管理 | 创建、编辑、删除页面，虚拟文件夹 |
| 块编辑器 | 斜杠命令 `/` 驱动的块创建 |
| V8 渲染引擎 | JSON Schema 驱动，严格单向数据流 |
| Wiki 链接 | `[[页面名]]` 语法，支持悬停预览 |
| 主题 | 亮色 / 暗色模式，语义化颜色 |
| 国际化 | 中文 / 英文切换 |
| 回收站 | 软删除，可恢复 |
| 标签页 | 多标签浏览，历史记录 |

</details>

<details open>
<summary><strong>块类型</strong></summary>

| 分类 | 块 |
|------|-----|
| 基础 | 文本、标题 (H1-H3)、分隔线 |
| 列表 | 无序、有序、待办、单选、多选 |
| 媒体 | 图片、视频、音频、文件、代码块 |
| 布局 | 引用、标注、折叠 |
| 数据 | 表格、价格计算器 |
| 链接 | 页面链接、网页链接、书签 |

</details>

<details>
<summary><strong>开发者工具</strong></summary>

| 工具 | 说明 |
|------|------|
| Schema 编辑器 | 实时 JSON 编辑与预览 |
| 模板库 | 预置组件模板 |
| 调试控制台 | 表达式、事件、状态日志 |
| 文档 | Schema 语法参考与教程 |

</details>

---

## 路线图

```
v0.2.0 ──────────────────────────────────────────────────────── 当前
   │
   │   知识图谱、Wiki 链接、反向链接
   │
v0.3.0 ─────────────────────────────────────────────────────── 下一步
   │
   │   社区生态
   │   ├─ 组件分享 - 分享自定义组件
   │   ├─ 一键安装 - 浏览并即时安装
   │   └─ 评分评论 - 社区反馈
   │
v0.4.0 ──────────────────────────────────────────────────────────
   │
   │   云同步
   │   ├─ 端到端加密
   │   └─ 跨设备同步
   │
v0.5.0 ──────────────────────────────────────────────────────────
   │
   │   移动端
   │   ├─ iOS App - iPhone / iPad
   │   └─ Android App
   │
v1.0.0 ──────────────────────────────────────────────────────────
   │
   │   Vibe Coding（AI 工作流）
   │   ├─ AI 组件生成
   │   └─ 自然语言界面
   │
   ▼
```

---

## 开发者指南

### 环境要求

开始之前，请确保已安装以下工具：

- **Node.js** 18+ ([下载](https://nodejs.org))
- **pnpm** ([安装](https://pnpm.io/installation))
- **Rust** ([安装](https://www.rust-lang.org/tools/install))
- **系统依赖**（Tauri 所需）：
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - **Windows**: Microsoft Visual Studio C++ Build Tools

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/yourusername/lore-note.git
cd lore-note

# 安装依赖
pnpm install

# 运行开发服务器（支持热重载）
pnpm run tauri dev

# 构建生产版本
pnpm run tauri build
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm run tauri dev` | 启动 Tauri 开发服务器 |
| `pnpm run tauri build` | 构建当前平台的生产应用 |
| `pnpm dev` | 仅启动 Vite 开发服务器（前端） |
| `pnpm build` | 仅构建前端 |
| `pnpm tsc --noEmit` | 运行 TypeScript 类型检查 |

### 项目结构

```
lore-note/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── engine-v8/          # JSON Schema 渲染引擎
│   ├── features/           # 功能模块
│   ├── services/           # 业务逻辑层
│   ├── stores/             # Zustand 状态管理
│   └── types/              # TypeScript 类型定义
├── src-tauri/              # Tauri 后端（Rust）
│   ├── src/                # Rust 源代码
│   ├── icons/              # 应用图标
│   └── capabilities/       # Tauri 权限配置
├── public/                 # 静态资源
└── package.json            # 依赖与脚本
```

### 贡献

欢迎贡献！请随时提交 Issue 和 Pull Request。

### 发布流程

创建新版本并自动编译所有平台的安装包：

```bash
# 快速发布
./release.sh v0.2.0
```

这将通过 GitHub Actions 自动构建 macOS、Linux 和 Windows 的安装程序。

详细说明请查看 [.github/RELEASE.md](.github/RELEASE.md)。

---

## 文档

详细的 JSON Schema 语法、表达式系统和组件开发指南请查阅：

**[LoreNote 文档 →](https://github.com/user/lorenote-docs)**

---

## 许可证

采用 AGPLv3 许可证发布。详见 [LICENSE.md](LICENSE.md)。

---

<div align="center">

灵感来源于 [Notion](https://notion.so)、[Obsidian](https://obsidian.md) 和 [AppFlowy](https://appflowy.io)

</div>
