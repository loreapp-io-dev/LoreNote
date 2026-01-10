<div align="center">

<img src="logo.png" alt="LoreNote Logo" width="120" />

# ✨ LoreNote ✨

### <span style="color: #3B82F6">The JSON-Driven Note-Taking App</span>

**"Component is Page, Page is Component"**

[![Version](https://img.shields.io/badge/version-0.1.0--beta-blue.svg)]()
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)]()
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)

**[中文](README_CN.md)** | English

<br/>

<img src="display1.png" alt="LoreNote Screenshot 1" width="80%" />

<br/><br/>

<img src="display2.png" alt="LoreNote Screenshot 2" width="80%" />

</div>

---

## About

LoreNote is a modern desktop note-taking application with a unique approach: **every block is defined by JSON Schema, not hardcoded components**.

> *Inspired by Notion's block-based editing and Obsidian's local-first philosophy, powered by modern web technologies.*

---

## Core Concept: JSON Components

### The Problem with Traditional Note Apps

```tsx
// ❌ Traditional: Every component requires developer code
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

// Want a new component? Wait for developers to release an update...
```

### LoreNote's Solution

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

**Zero TSX. Pure JSON. Full Interactivity.**

---

## Why This Matters

### 1. Infinite Extensibility

| Traditional Apps | LoreNote |
|-----------------|----------|
| Components decided by dev team | Users define their own components |
| New features require version updates | Write JSON, use immediately |
| High coding barrier | Just understand JSON structure |

### 2. Community Creation Ecosystem

```
User A creates a "Habit Tracker" component
    ↓
Export as habit-tracker.json (only 2KB)
    ↓
Share to community / Send to friends
    ↓
User B imports, ready to use
    ↓
User B modifies styles, creates own version
```

**No plugins to install. No review process. No coding required.**

### 3. AI Friendly

```
User: Help me create a project progress tracker

AI: Sure, here's the component JSON...
{
  "element": "div",
  "data": { "tasks": [], "progress": 0 },
  ...
}

User: Copy → Paste → Done
```

**JSON is the format AI excels at generating.** LoreNote will deeply integrate AI workflows, making component creation even simpler.

### 4. Full Interactive Capabilities

JSON Schema is not a simplified version - it supports complete interactive logic:

| Capability | Example |
|------------|---------|
| Data Binding | `${data.title}` |
| Conditional Rendering | `"condition": "data.count > 0"` |
| Loop Rendering | `"loop": { "items": "data.list" }` |
| Event Handling | `"events": { "click": "data.count++" }` |
| Computed Expressions | `${data.items.reduce((s,i) => s + i.price, 0)}` |
| Conditional Styles | `"conditional": [{ "condition": "...", "className": "..." }]` |

---

## Tech Stack

<table>
<tr>
<td align="center" width="100">
<strong>React 19</strong><br/>Frontend
</td>
<td align="center" width="100">
<strong>Tauri 2</strong><br/>Desktop
</td>
<td align="center" width="100">
<strong>Tailwind 4</strong><br/>Styling
</td>
<td align="center" width="100">
<strong>Shadcn UI</strong><br/>Components
</td>
<td align="center" width="100">
<strong>Zustand</strong><br/>State
</td>
</tr>
</table>

---

## Features

### v0.1.0-beta

<details open>
<summary><strong>Core Features</strong></summary>

| Feature | Description |
|---------|-------------|
| Vault System | Multi-vault support with metadata management |
| Page Management | Create, edit, delete pages with virtual folders |
| Block Editor | Slash command `/` driven block creation |
| V8 Render Engine | JSON Schema driven, strict unidirectional data flow *(Not Google's, but equally fast)* |
| Theme | Light / Dark mode with semantic colors |
| i18n | Chinese / English language switching |
| Trash | Soft delete with restore capability |
| Tabs | Multi-tab browsing with history |

</details>

<details open>
<summary><strong>Block Types</strong></summary>

| Category | Blocks |
|----------|--------|
| Basic | Text, Heading (H1-H3), Divider |
| List | Bullet, Numbered, Todo, Radio, Checkbox |
| Media | Image, Code Block |
| Layout | Quote, Callout, Toggle |
| Data | Table, Price Calculator |

</details>

<details>
<summary><strong>Developer Tools</strong></summary>

| Tool | Description |
|------|-------------|
| Schema Editor | Live JSON editing with real-time preview |
| Template Library | Pre-built component templates |
| Debug Console | Expression, event, state logging |
| Documentation | Schema syntax reference & tutorials |

</details>

---

## Roadmap

```
v0.1.0 ──────────────────────────────────────────────────────── NOW
   │
   │   Core Editor, Vault System, Block Types, i18n
   │
v0.2.0 ─────────────────────────────────────────────────────── NEXT
   │
   │   Knowledge Graph
   │   ├─ Relation Graph - Visual page connections
   │   ├─ Backlinks - Automatic link tracking
   │   └─ Graph View - Interactive visualization
   │
v0.3.0 ──────────────────────────────────────────────────────────
   │
   │   Vibe Coding (AI Workflow)
   │   ├─ AI Component Generation - Describe needs, auto-generate JSON
   │   └─ Smart Completion - AI assistance while editing
   │
v0.4.0 ──────────────────────────────────────────────────────────
   │
   │   Community Ecosystem
   │   ├─ Component Market - Browse, download community components
   │   ├─ One-Click Share - Publish your components
   │   └─ Version Management - Component updates & sync
   │
v0.5.0 ──────────────────────────────────────────────────────────
   │
   │   Stable Release
   │   ├─ Cloud Sync - Multi-device data synchronization
   │   └─ Stability - Comprehensive testing & fixes
   │
v1.0.0 ──────────────────────────────────────────────────────────
   │
   │   Mobile
   │   ├─ iOS App - iPhone / iPad
   │   └─ Android App
   │
   ▼
```

---

## Documentation

For detailed JSON Schema syntax, expression system, and component development guide:

**[LoreNote Docs →](https://github.com/loreapp-io-dev/jsonSchema)**

---

<div align="center">

Inspired by [Notion](https://notion.so), [Obsidian](https://obsidian.md) & [AppFlowy](https://appflowy.io)

</div>
