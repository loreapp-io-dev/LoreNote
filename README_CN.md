<div align="center">

<img src="logo.png" alt="LoreNote Logo" width="120" />

# ✨ LoreNote ✨

### <span style="color: #3B82F6">JSON 驱动的笔记应用</span>

**"组件即页面，页面即组件"**

[![Version](https://img.shields.io/badge/version-0.1.0--beta-blue.svg)]()
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

### v0.1.0-beta

<details open>
<summary><strong>核心功能</strong></summary>

| 功能 | 说明 |
|------|------|
| 仓库系统 | 多仓库支持，元数据管理 |
| 页面管理 | 创建、编辑、删除页面，虚拟文件夹 |
| 块编辑器 | 斜杠命令 `/` 驱动的块创建 |
| V8 渲染引擎 | JSON Schema 驱动，严格单向数据流 *(不是 Google 那个，但同样快)* |
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
| 媒体 | 图片、代码块 |
| 布局 | 引用、标注、折叠 |
| 数据 | 表格、价格计算器 |

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
v0.1.0 ──────────────────────────────────────────────────────── 当前
   │
   │   核心编辑器、仓库系统、块类型、国际化
   │
v0.2.0 ─────────────────────────────────────────────────────── 下一步
   │
   │   知识图谱
   │   ├─ 关系图 - 页面可视化连接
   │   ├─ 反向链接 - 自动链接追踪
   │   └─ 图视图 - 交互式可视化
   │
v0.3.0 ──────────────────────────────────────────────────────────
   │
   │   社区生态
   │   ├─ 组件市场 - 浏览、下载社区组件
   │   ├─ 一键分享 - 发布你的组件
   │   └─ 版本管理 - 组件更新与同步
   │
v0.4.0 ──────────────────────────────────────────────────────────
   │
   │   正式版
   │   ├─ 云同步 - 多设备数据同步
   │   └─ 稳定性优化 - 全面测试与修复
   │
v1.0.0 ──────────────────────────────────────────────────────────
   │
   │   移动端
   │   ├─ iOS App - iPhone / iPad
   │   └─ Android App
   │
   ▼
```

---

## 文档

详细的 JSON Schema 语法、表达式系统和组件开发指南请查阅：

**[LoreNote 文档 →](https://github.com/loreapp-io-dev/jsonSchema)**

---

<div align="center">

灵感来源于 [Notion](https://notion.so)、[Obsidian](https://obsidian.md) 和 [AppFlowy](https://appflowy.io)

</div>
