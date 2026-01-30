import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Code, ArrowLeft, Lightbulb, Zap, Repeat, Eye, Palette, Database, MousePointer, Download } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Locale } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

/** 生成 Schema 文档 Markdown（中文版） */
function generateSchemaDocMarkdownZh(): string {
  return `# LoreNote Schema 组件开发规范

> 本文档描述 LoreNote 的 JSON Schema 组件语法，可用于指导 AI 生成符合规范的组件。

## 核心概念

LoreNote 使用纯 JSON 描述 UI 组件，无需编写 React/TSX 代码。所有组件通过 JSON Schema 定义，引擎自动渲染为 React 元素。

---

## Schema 结构

\`\`\`typescript
interface SchemaComponent {
  element: string;           // HTML 标签或内置别名（必填）
  id?: string;               // 组件 ID（交互组件必须有，用于状态持久化）
  props?: Record<string, unknown>;  // 属性（支持 \${} 表达式）
  style?: ComponentStyle;    // 样式配置
  children?: (SchemaComponent | string)[];  // 子元素
  data?: Record<string, unknown>;   // 组件状态数据
  events?: Record<string, string>;  // 事件处理表达式
  condition?: string;        // 条件渲染表达式
  loop?: {                   // 循环渲染
    items: string;           // 数据源表达式
    itemName?: string;       // 当前项变量名（默认 item）
    indexName?: string;      // 索引变量名（默认 index）
  };
}
\`\`\`

---

## 内置元素别名

| 别名 | HTML 标签 |
|------|-----------|
| box | div |
| text | span |
| input | input |
| button | button |
| image | img |
| link | a |

---

## 表达式语法

使用 \`\${}\` 包裹表达式：

\`\`\`javascript
// 数据绑定
"\${data.fieldName}"

// 属性引用
"\${props.propName}"

// 条件判断
"\${condition ? trueValue : falseValue}"

// 比较运算
"\${a > b}", "\${a === b}"

// 逻辑运算
"\${a && b}", "\${a || b}", "\${!a}"

// 数学运算
"\${a + b}", "\${a * b}"

// 数组聚合
"\${data.items.reduce((sum, item) => sum + item.value, 0)}"
\`\`\`

---

## 事件处理

### 事件类型

| 元素类型 | 事件 | 说明 |
|----------|------|------|
| 文本输入框 | input | 实时响应每次输入 |
| 复选框/单选框 | change | 状态切换时触发 |
| 按钮 | click | 点击时触发 |

### 事件表达式

\`\`\`javascript
// 简单赋值
"data.field = value"

// 数组项更新（循环中使用 idx）
"data.items[idx].field = event.target.value"

// 数组 push（使用 $newId 生成唯一 ID）
"data.items.push({ id: $newId, name: '', value: 0 })"

// 数组 splice 删除
"data.items.splice(idx, 1)"

// 数值转换
"data.items[idx].quantity = Number(event.target.value) || 0"

// 切换布尔值
"data.enabled = !data.enabled"
\`\`\`

### 内置上下文变量

| 变量 | 说明 |
|------|------|
| event.target.value | 输入框的值 |
| event.target.checked | 复选框状态 |
| $newId | 运行时生成的唯一 ID |
| idx / $index | 循环索引 |
| item | 循环当前项（可通过 itemName 自定义） |
| $first / $last | 是否为首项/末项 |

---

## 样式配置

### 使用 Tailwind CSS

\`\`\`json
{
  "element": "div",
  "props": {
    "className": "flex items-center gap-2 p-4 rounded-lg border border-border"
  }
}
\`\`\`

### 内联样式

\`\`\`json
{
  "element": "div",
  "style": {
    "className": "p-4 rounded-lg",
    "inline": {
      "backgroundColor": "#3b82f6",
      "color": "#ffffff"
    }
  }
}
\`\`\`

### 条件样式（在 className 中使用表达式）

\`\`\`json
{
  "element": "button",
  "data": { "active": false },
  "props": {
    "className": "px-4 py-2 rounded \${data.active ? 'bg-primary text-white' : 'bg-muted'}"
  }
}
\`\`\`

### 推荐的主题变量

| 类名 | 用途 |
|------|------|
| bg-background | 页面背景 |
| bg-card | 卡片背景 |
| bg-muted | 次要背景 |
| bg-primary | 主题色背景 |
| text-foreground | 主要文字 |
| text-muted-foreground | 次要文字 |
| text-primary-foreground | 主题色上的文字 |
| border-border | 边框颜色 |

---

## 循环渲染

\`\`\`json
{
  "element": "div",
  "data": {
    "items": [
      { "id": "1", "name": "项目 1" },
      { "id": "2", "name": "项目 2" }
    ]
  },
  "children": [
    {
      "element": "div",
      "loop": {
        "items": "data.items",
        "itemName": "item",
        "indexName": "idx"
      },
      "props": { "className": "p-2 border-b" },
      "children": ["\${idx + 1}. \${item.name}"]
    }
  ]
}
\`\`\`

---

## 条件渲染

\`\`\`json
{
  "element": "div",
  "data": { "showMessage": true, "status": "success" },
  "children": [
    {
      "element": "p",
      "condition": "data.showMessage",
      "children": ["这段文字仅在 showMessage 为 true 时显示"]
    },
    {
      "element": "span",
      "condition": "data.status === 'success'",
      "props": { "className": "text-green-500" },
      "children": ["成功"]
    }
  ]
}
\`\`\`

---

## 完整示例

### 1. 计数器

\`\`\`json
{
  "element": "div",
  "id": "counter-1",
  "props": { "className": "flex items-center gap-3" },
  "data": { "count": 0 },
  "children": [
    {
      "element": "button",
      "props": { "className": "h-8 w-8 rounded-md border bg-muted hover:bg-accent" },
      "events": { "click": "data.count = data.count - 1" },
      "children": ["-"]
    },
    {
      "element": "span",
      "props": { "className": "min-w-[3rem] text-center text-lg font-medium" },
      "children": ["\${data.count}"]
    },
    {
      "element": "button",
      "props": { "className": "h-8 w-8 rounded-md border bg-muted hover:bg-accent" },
      "events": { "click": "data.count = data.count + 1" },
      "children": ["+"]
    }
  ]
}
\`\`\`

### 2. 待办列表

\`\`\`json
{
  "element": "div",
  "id": "todo-list-1",
  "props": { "className": "space-y-2" },
  "data": {
    "items": [
      { "id": "1", "text": "第一个任务", "completed": false },
      { "id": "2", "text": "第二个任务", "completed": true }
    ]
  },
  "children": [
    {
      "element": "div",
      "loop": { "items": "data.items", "itemName": "item", "indexName": "idx" },
      "props": { "className": "flex items-center gap-2 p-2 border rounded" },
      "children": [
        {
          "element": "input",
          "props": { "type": "checkbox", "checked": "\${item.completed}" },
          "events": { "change": "data.items[idx].completed = event.target.checked" }
        },
        {
          "element": "span",
          "props": { "className": "\${item.completed ? 'line-through text-muted-foreground' : ''}" },
          "children": ["\${item.text}"]
        },
        {
          "element": "button",
          "props": { "className": "ml-auto text-red-500 hover:text-red-700" },
          "events": { "click": "data.items.splice(idx, 1)" },
          "children": ["×"]
        }
      ]
    },
    {
      "element": "button",
      "props": { "className": "w-full py-2 border border-dashed rounded hover:bg-muted" },
      "events": { "click": "data.items.push({ id: $newId, text: '新任务', completed: false })" },
      "children": ["+ 添加任务"]
    }
  ]
}
\`\`\`

### 3. 表单输入

\`\`\`json
{
  "element": "div",
  "id": "form-1",
  "props": { "className": "space-y-4 p-4 border rounded-lg" },
  "data": { "name": "", "email": "" },
  "children": [
    {
      "element": "div",
      "props": { "className": "space-y-2" },
      "children": [
        { "element": "label", "props": { "className": "text-sm font-medium" }, "children": ["姓名"] },
        {
          "element": "input",
          "props": {
            "type": "text",
            "className": "w-full px-3 py-2 border rounded-md outline-none focus:border-primary",
            "placeholder": "请输入姓名",
            "value": "\${data.name}"
          },
          "events": { "input": "data.name = event.target.value" }
        }
      ]
    },
    {
      "element": "div",
      "props": { "className": "space-y-2" },
      "children": [
        { "element": "label", "props": { "className": "text-sm font-medium" }, "children": ["邮箱"] },
        {
          "element": "input",
          "props": {
            "type": "email",
            "className": "w-full px-3 py-2 border rounded-md outline-none focus:border-primary",
            "placeholder": "请输入邮箱",
            "value": "\${data.email}"
          },
          "events": { "input": "data.email = event.target.value" }
        }
      ]
    },
    {
      "element": "button",
      "props": { "className": "w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" },
      "children": ["提交"]
    }
  ]
}
\`\`\`

### 4. 切换开关

\`\`\`json
{
  "element": "div",
  "id": "toggle-1",
  "props": { "className": "flex items-center gap-3" },
  "data": { "enabled": false },
  "children": [
    {
      "element": "button",
      "props": {
        "className": "relative h-6 w-11 rounded-full transition-colors \${data.enabled ? 'bg-primary' : 'bg-muted'}"
      },
      "events": { "click": "data.enabled = !data.enabled" },
      "children": [
        {
          "element": "div",
          "props": {
            "className": "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform \${data.enabled ? 'translate-x-5' : 'translate-x-0.5'}"
          }
        }
      ]
    },
    {
      "element": "span",
      "props": { "className": "text-sm text-muted-foreground" },
      "children": ["\${data.enabled ? '已开启' : '已关闭'}"]
    }
  ]
}
\`\`\`

---

## 注意事项

1. **交互组件必须有 id**: 任何需要状态持久化的组件都必须设置 \`id\` 字段
2. **输入框使用 input 事件**: 文本输入框应使用 \`input\` 事件而非 \`change\` 事件
3. **数组操作使用 $newId**: 添加数组项时使用 \`$newId\` 生成唯一标识
4. **使用语义化颜色**: 优先使用 \`bg-primary\`、\`text-foreground\` 等语义化类名
5. **避免复杂方法调用**: 表达式中避免使用 \`toLocaleString()\` 等复杂方法

---

*此文档由 LoreNote 生成，可用于指导 AI 生成符合规范的 Schema 组件。*
`;
}

/** 生成 Schema 文档 Markdown（英文版） */
function generateSchemaDocMarkdownEn(): string {
  return `# LoreNote Schema Component Development Guide

> This document describes the JSON Schema component syntax for LoreNote, which can be used to guide AI in generating compliant components.

## Core Concepts

LoreNote uses pure JSON to describe UI components without writing React/TSX code. All components are defined via JSON Schema, and the engine automatically renders them as React elements.

---

## Schema Structure

\`\`\`typescript
interface SchemaComponent {
  element: string;           // HTML tag or built-in alias (required)
  id?: string;               // Component ID (required for interactive components, used for state persistence)
  props?: Record<string, unknown>;  // Properties (supports \${} expressions)
  style?: ComponentStyle;    // Style configuration
  children?: (SchemaComponent | string)[];  // Child elements
  data?: Record<string, unknown>;   // Component state data
  events?: Record<string, string>;  // Event handler expressions
  condition?: string;        // Conditional rendering expression
  loop?: {                   // Loop rendering
    items: string;           // Data source expression
    itemName?: string;       // Current item variable name (default: item)
    indexName?: string;      // Index variable name (default: index)
  };
}
\`\`\`

---

## Built-in Element Aliases

| Alias | HTML Tag |
|-------|----------|
| box | div |
| text | span |
| input | input |
| button | button |
| image | img |
| link | a |

---

## Expression Syntax

Wrap expressions with \`\${}\`:

\`\`\`javascript
// Data binding
"\${data.fieldName}"

// Property reference
"\${props.propName}"

// Conditional expression
"\${condition ? trueValue : falseValue}"

// Comparison operators
"\${a > b}", "\${a === b}"

// Logical operators
"\${a && b}", "\${a || b}", "\${!a}"

// Math operators
"\${a + b}", "\${a * b}"

// Array aggregation
"\${data.items.reduce((sum, item) => sum + item.value, 0)}"
\`\`\`

---

## Event Handling

### Event Types

| Element Type | Event | Description |
|--------------|-------|-------------|
| Text input | input | Responds to each input in real-time |
| Checkbox/Radio | change | Triggered on state change |
| Button | click | Triggered on click |

### Event Expressions

\`\`\`javascript
// Simple assignment
"data.field = value"

// Array item update (use idx in loops)
"data.items[idx].field = event.target.value"

// Array push (use $newId to generate unique ID)
"data.items.push({ id: $newId, name: '', value: 0 })"

// Array splice delete
"data.items.splice(idx, 1)"

// Number conversion
"data.items[idx].quantity = Number(event.target.value) || 0"

// Toggle boolean
"data.enabled = !data.enabled"
\`\`\`

### Built-in Context Variables

| Variable | Description |
|----------|-------------|
| event.target.value | Input field value |
| event.target.checked | Checkbox state |
| $newId | Runtime-generated unique ID |
| idx / $index | Loop index |
| item | Current loop item (customizable via itemName) |
| $first / $last | Whether first/last item |

---

## Style Configuration

### Using Tailwind CSS

\`\`\`json
{
  "element": "div",
  "props": {
    "className": "flex items-center gap-2 p-4 rounded-lg border border-border"
  }
}
\`\`\`

### Inline Styles

\`\`\`json
{
  "element": "div",
  "style": {
    "className": "p-4 rounded-lg",
    "inline": {
      "backgroundColor": "#3b82f6",
      "color": "#ffffff"
    }
  }
}
\`\`\`

### Conditional Styles (expressions in className)

\`\`\`json
{
  "element": "button",
  "data": { "active": false },
  "props": {
    "className": "px-4 py-2 rounded \${data.active ? 'bg-primary text-white' : 'bg-muted'}"
  }
}
\`\`\`

### Recommended Theme Variables

| Class | Purpose |
|-------|---------|
| bg-background | Page background |
| bg-card | Card background |
| bg-muted | Secondary background |
| bg-primary | Primary color background |
| text-foreground | Primary text |
| text-muted-foreground | Secondary text |
| text-primary-foreground | Text on primary color |
| border-border | Border color |

---

## Loop Rendering

\`\`\`json
{
  "element": "div",
  "data": {
    "items": [
      { "id": "1", "name": "Item 1" },
      { "id": "2", "name": "Item 2" }
    ]
  },
  "children": [
    {
      "element": "div",
      "loop": {
        "items": "data.items",
        "itemName": "item",
        "indexName": "idx"
      },
      "props": { "className": "p-2 border-b" },
      "children": ["\${idx + 1}. \${item.name}"]
    }
  ]
}
\`\`\`

---

## Conditional Rendering

\`\`\`json
{
  "element": "div",
  "data": { "showMessage": true, "status": "success" },
  "children": [
    {
      "element": "p",
      "condition": "data.showMessage",
      "children": ["This text only shows when showMessage is true"]
    },
    {
      "element": "span",
      "condition": "data.status === 'success'",
      "props": { "className": "text-green-500" },
      "children": ["Success"]
    }
  ]
}
\`\`\`

---

## Complete Examples

### 1. Counter

\`\`\`json
{
  "element": "div",
  "id": "counter-1",
  "props": { "className": "flex items-center gap-3" },
  "data": { "count": 0 },
  "children": [
    {
      "element": "button",
      "props": { "className": "h-8 w-8 rounded-md border bg-muted hover:bg-accent" },
      "events": { "click": "data.count = data.count - 1" },
      "children": ["-"]
    },
    {
      "element": "span",
      "props": { "className": "min-w-[3rem] text-center text-lg font-medium" },
      "children": ["\${data.count}"]
    },
    {
      "element": "button",
      "props": { "className": "h-8 w-8 rounded-md border bg-muted hover:bg-accent" },
      "events": { "click": "data.count = data.count + 1" },
      "children": ["+"]
    }
  ]
}
\`\`\`

### 2. Todo List

\`\`\`json
{
  "element": "div",
  "id": "todo-list-1",
  "props": { "className": "space-y-2" },
  "data": {
    "items": [
      { "id": "1", "text": "First task", "completed": false },
      { "id": "2", "text": "Second task", "completed": true }
    ]
  },
  "children": [
    {
      "element": "div",
      "loop": { "items": "data.items", "itemName": "item", "indexName": "idx" },
      "props": { "className": "flex items-center gap-2 p-2 border rounded" },
      "children": [
        {
          "element": "input",
          "props": { "type": "checkbox", "checked": "\${item.completed}" },
          "events": { "change": "data.items[idx].completed = event.target.checked" }
        },
        {
          "element": "span",
          "props": { "className": "\${item.completed ? 'line-through text-muted-foreground' : ''}" },
          "children": ["\${item.text}"]
        },
        {
          "element": "button",
          "props": { "className": "ml-auto text-red-500 hover:text-red-700" },
          "events": { "click": "data.items.splice(idx, 1)" },
          "children": ["×"]
        }
      ]
    },
    {
      "element": "button",
      "props": { "className": "w-full py-2 border border-dashed rounded hover:bg-muted" },
      "events": { "click": "data.items.push({ id: $newId, text: 'New task', completed: false })" },
      "children": ["+ Add Task"]
    }
  ]
}
\`\`\`

### 3. Form Input

\`\`\`json
{
  "element": "div",
  "id": "form-1",
  "props": { "className": "space-y-4 p-4 border rounded-lg" },
  "data": { "name": "", "email": "" },
  "children": [
    {
      "element": "div",
      "props": { "className": "space-y-2" },
      "children": [
        { "element": "label", "props": { "className": "text-sm font-medium" }, "children": ["Name"] },
        {
          "element": "input",
          "props": {
            "type": "text",
            "className": "w-full px-3 py-2 border rounded-md outline-none focus:border-primary",
            "placeholder": "Enter your name",
            "value": "\${data.name}"
          },
          "events": { "input": "data.name = event.target.value" }
        }
      ]
    },
    {
      "element": "div",
      "props": { "className": "space-y-2" },
      "children": [
        { "element": "label", "props": { "className": "text-sm font-medium" }, "children": ["Email"] },
        {
          "element": "input",
          "props": {
            "type": "email",
            "className": "w-full px-3 py-2 border rounded-md outline-none focus:border-primary",
            "placeholder": "Enter your email",
            "value": "\${data.email}"
          },
          "events": { "input": "data.email = event.target.value" }
        }
      ]
    },
    {
      "element": "button",
      "props": { "className": "w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" },
      "children": ["Submit"]
    }
  ]
}
\`\`\`

### 4. Toggle Switch

\`\`\`json
{
  "element": "div",
  "id": "toggle-1",
  "props": { "className": "flex items-center gap-3" },
  "data": { "enabled": false },
  "children": [
    {
      "element": "button",
      "props": {
        "className": "relative h-6 w-11 rounded-full transition-colors \${data.enabled ? 'bg-primary' : 'bg-muted'}"
      },
      "events": { "click": "data.enabled = !data.enabled" },
      "children": [
        {
          "element": "div",
          "props": {
            "className": "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform \${data.enabled ? 'translate-x-5' : 'translate-x-0.5'}"
          }
        }
      ]
    },
    {
      "element": "span",
      "props": { "className": "text-sm text-muted-foreground" },
      "children": ["\${data.enabled ? 'Enabled' : 'Disabled'}"]
    }
  ]
}
\`\`\`

---

## Important Notes

1. **Interactive components must have id**: Any component requiring state persistence must set the \`id\` field
2. **Use input event for text inputs**: Text inputs should use \`input\` event instead of \`change\`
3. **Use $newId for array operations**: Use \`$newId\` to generate unique identifiers when adding array items
4. **Use semantic colors**: Prefer semantic class names like \`bg-primary\`, \`text-foreground\`
5. **Avoid complex method calls**: Avoid using methods like \`toLocaleString()\` in expressions

---

*This document is generated by LoreNote and can be used to guide AI in generating compliant Schema components.*
`;
}

/** 根据语言生成 Schema 文档 */
function generateSchemaDocMarkdown(locale: Locale): string {
  return locale === 'zh' ? generateSchemaDocMarkdownZh() : generateSchemaDocMarkdownEn();
}

/** 可折叠区域组件 */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 py-2 text-left text-xs font-medium text-foreground hover:bg-accent/50 transition-colors"
      >
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {icon}
        {title}
      </button>
      {isOpen && (
        <div className="pb-3 pl-4 pr-1 text-[11px] text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

/** 代码块组件 */
function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  return (
    <pre className={cn(
      "mt-2 overflow-x-auto rounded-md bg-muted p-2 text-[10px] leading-relaxed",
      language === 'json' && "text-blue-600 dark:text-blue-400"
    )}>
      <code>{code}</code>
    </pre>
  );
}

type TutorialKey = 'intro' | 'styles' | 'data' | 'events' | 'loop' | 'condition' | 'bestPractices';

/** 教程图标映射 */
const tutorialIcons: Record<TutorialKey, typeof Lightbulb> = {
  intro: Lightbulb,
  styles: Palette,
  data: Database,
  events: MousePointer,
  loop: Repeat,
  condition: Eye,
  bestPractices: Zap,
};

/** 教程内容 */
const tutorialContents: Record<TutorialKey, { content: React.ReactNode }> = {
  intro: {
    content: (
      <div className="space-y-3">
        <p>
          Schema 组件是 LoreNote 的核心概念，它允许你使用 JSON 描述 UI 组件，
          而无需编写任何 React 代码。
        </p>

        <h4 className="font-medium text-foreground">最简单的组件</h4>
        <CodeBlock code={`{
  "element": "div",
  "children": ["Hello, LoreNote!"]
}`} />

        <h4 className="font-medium text-foreground">添加样式</h4>
        <CodeBlock code={`{
  "element": "div",
  "props": {
    "className": "p-4 rounded-lg bg-blue-100"
  },
  "children": ["带样式的组件"]
}`} />

        <h4 className="font-medium text-foreground">元素别名</h4>
        <ul className="list-disc pl-4 space-y-0.5">
          <li><code className="text-primary">box</code> → div</li>
          <li><code className="text-primary">text</code> → span</li>
          <li><code className="text-primary">input</code> → input</li>
          <li><code className="text-primary">button</code> → button</li>
        </ul>
      </div>
    ),
  },
  styles: {
    content: (
      <div className="space-y-3">
        <p>使用 Tailwind CSS 进行样式设计。</p>

        <h4 className="font-medium text-foreground">基础样式</h4>
        <CodeBlock code={`{
  "element": "div",
  "props": {
    "className": "flex items-center gap-2 p-4 rounded-lg border"
  }
}`} />

        <h4 className="font-medium text-foreground">内联样式（自定义颜色）</h4>
        <p>使用 style.inline 设置自定义样式值：</p>
        <CodeBlock code={`{
  "element": "div",
  "style": {
    "className": "p-4 rounded-lg",
    "inline": {
      "backgroundColor": "#3b82f6",
      "color": "#ffffff"
    }
  }
}`} />

        <h4 className="font-medium text-foreground text-amber-600">⚠️ 注意</h4>
        <p className="text-amber-600">
          Tailwind 任意值语法如 <code>text-[#fff]</code> 在预览中不生效，
          请使用预定义类名（如 text-white）或 style.inline。
        </p>

        <h4 className="font-medium text-foreground">条件样式</h4>
        <CodeBlock code={`{
  "element": "button",
  "data": { "active": false },
  "style": {
    "conditional": [{
      "condition": "data.active",
      "className": "bg-primary text-white"
    }]
  }
}`} />

        <h4 className="font-medium text-foreground">主题变量</h4>
        <ul className="list-disc pl-4 space-y-0.5">
          <li><code className="text-primary">bg-background</code>、<code className="text-primary">bg-card</code></li>
          <li><code className="text-primary">text-foreground</code>、<code className="text-primary">text-muted-foreground</code></li>
          <li><code className="text-primary">border-border</code></li>
        </ul>
      </div>
    ),
  },
  data: {
    content: (
      <div className="space-y-3">
        <p>使用 data 字段定义组件的内部状态。</p>

        <h4 className="font-medium text-foreground">定义状态</h4>
        <CodeBlock code={`{
  "data": {
    "count": 0,
    "name": "用户名",
    "items": ["A", "B", "C"]
  }
}`} />

        <h4 className="font-medium text-foreground">数据绑定</h4>
        <p>使用 <code className="text-primary">${'{}'}</code> 语法引用数据：</p>
        <CodeBlock code={`"children": ["欢迎 \${data.name}!"]`} />

        <h4 className="font-medium text-foreground">表达式计算</h4>
        <CodeBlock code={`"children": ["总价: \${data.price * data.quantity}"]`} />
      </div>
    ),
  },
  events: {
    content: (
      <div className="space-y-3">
        <p>通过 events 字段处理用户交互，支持多种事件类型。</p>

        <h4 className="font-medium text-foreground">事件类型选择</h4>
        <ul className="list-disc pl-4 space-y-0.5">
          <li><code className="text-primary">input</code> - 文本输入框实时响应</li>
          <li><code className="text-primary">change</code> - 复选框/单选框状态切换</li>
          <li><code className="text-primary">click</code> - 按钮点击</li>
          <li><code className="text-primary">focus</code> / <code className="text-primary">blur</code> - 聚焦/失焦</li>
          <li><code className="text-primary">keydown</code> / <code className="text-primary">keyup</code> - 键盘事件</li>
        </ul>

        <h4 className="font-medium text-foreground">计数器示例</h4>
        <CodeBlock code={`{
  "element": "div",
  "id": "counter-demo",
  "props": { "className": "flex items-center gap-3" },
  "data": { "count": 0 },
  "children": [
    {
      "element": "button",
      "props": { "className": "h-8 w-8 rounded border bg-muted" },
      "events": { "click": "data.count = data.count - 1" },
      "children": ["-"]
    },
    {
      "element": "span",
      "children": ["\${data.count}"]
    },
    {
      "element": "button",
      "events": { "click": "data.count = data.count + 1" },
      "children": ["+"]
    }
  ]
}`} />

        <h4 className="font-medium text-foreground">输入框示例</h4>
        <CodeBlock code={`{
  "element": "input",
  "props": {
    "type": "text",
    "value": "\${data.name}",
    "placeholder": "请输入..."
  },
  "events": { "input": "data.name = event.target.value" }
}`} />

        <h4 className="font-medium text-foreground">数组操作</h4>
        <CodeBlock code={`// 添加项（使用 $newId 生成唯一 ID）
"events": { "click": "data.items.push({ id: $newId, name: '' })" }

// 删除项（在循环中使用 idx）
"events": { "click": "data.items.splice(idx, 1)" }

// 更新数组项字段
"events": { "input": "data.items[idx].name = event.target.value" }`} />

        <h4 className="font-medium text-foreground text-amber-600">⚠️ 重要提示</h4>
        <ul className="list-disc pl-4 space-y-0.5 text-amber-600">
          <li>文本输入框使用 <code>input</code> 事件，非 <code>change</code></li>
          <li>复选框/单选框使用 <code>change</code> 事件</li>
          <li>交互组件根元素必须有 <code>id</code> 字段</li>
        </ul>
      </div>
    ),
  },
  loop: {
    content: (
      <div className="space-y-3">
        <p>使用 loop 字段可以循环渲染数组数据。</p>

        <h4 className="font-medium text-foreground">Loop 配置结构</h4>
        <CodeBlock code={`{
  "loop": {
    "items": "data.items",   // 数据源表达式
    "itemName": "item",      // 当前项变量名（默认 item）
    "indexName": "idx"       // 索引变量名（默认 index）
  }
}`} />

        <h4 className="font-medium text-foreground">循环上下文变量</h4>
        <ul className="list-disc pl-4 space-y-0.5">
          <li><code className="text-primary">item</code> - 当前迭代项</li>
          <li><code className="text-primary">idx / $index</code> - 当前索引</li>
          <li><code className="text-primary">$first</code> - 是否为第一项</li>
          <li><code className="text-primary">$last</code> - 是否为最后一项</li>
        </ul>

        <h4 className="font-medium text-foreground">待办列表完整示例</h4>
        <CodeBlock code={`{
  "element": "div",
  "id": "todo-list",
  "props": { "className": "space-y-2" },
  "data": {
    "items": [
      { "id": "1", "text": "任务1", "done": false }
    ]
  },
  "children": [
    {
      "element": "div",
      "loop": { "items": "data.items", "indexName": "idx" },
      "props": { "className": "flex items-center gap-2 p-2 border rounded" },
      "children": [
        {
          "element": "input",
          "props": { "type": "checkbox", "checked": "\${item.done}" },
          "events": { "change": "data.items[idx].done = event.target.checked" }
        },
        {
          "element": "span",
          "props": { "className": "\${item.done ? 'line-through' : ''}" },
          "children": ["\${item.text}"]
        },
        {
          "element": "button",
          "props": { "className": "ml-auto text-red-500" },
          "events": { "click": "data.items.splice(idx, 1)" },
          "children": ["×"]
        }
      ]
    },
    {
      "element": "button",
      "props": { "className": "w-full py-2 border border-dashed rounded" },
      "events": { "click": "data.items.push({ id: $newId, text: '新任务', done: false })" },
      "children": ["+ 添加任务"]
    }
  ]
}`} />
      </div>
    ),
  },
  condition: {
    content: (
      <div className="space-y-3">
        <p>使用 condition 字段根据条件动态显示或隐藏元素。</p>

        <h4 className="font-medium text-foreground">布尔条件</h4>
        <CodeBlock code={`{
  "element": "p",
  "condition": "data.showMessage",
  "children": ["条件为 true 时显示"]
}`} />

        <h4 className="font-medium text-foreground">比较条件</h4>
        <CodeBlock code={`{
  "condition": "data.status === 'success'",
  "props": { "className": "text-green-500" },
  "children": ["成功"]
}`} />

        <h4 className="font-medium text-foreground">复杂条件</h4>
        <CodeBlock code={`// 多条件组合
"condition": "data.count > 0 && data.count < 10"

// 或条件
"condition": "data.type === 'admin' || data.type === 'super'"

// 非空检查
"condition": "data.items.length > 0"`} />

        <h4 className="font-medium text-foreground">条件样式（另一种方式）</h4>
        <p>也可以在 className 中使用三元表达式实现条件样式：</p>
        <CodeBlock code={`{
  "element": "span",
  "props": {
    "className": "\${data.active ? 'bg-green-500 text-white' : 'bg-gray-200'}"
  },
  "children": ["\${data.active ? '在线' : '离线'}"]
}`} />

        <h4 className="font-medium text-foreground">状态徽章示例</h4>
        <CodeBlock code={`{
  "element": "div",
  "id": "status-demo",
  "data": { "status": "pending" },
  "children": [
    {
      "element": "span",
      "condition": "data.status === 'success'",
      "props": { "className": "px-2 py-1 rounded bg-green-100 text-green-800" },
      "children": ["成功"]
    },
    {
      "element": "span",
      "condition": "data.status === 'pending'",
      "props": { "className": "px-2 py-1 rounded bg-yellow-100 text-yellow-800" },
      "children": ["处理中"]
    },
    {
      "element": "span",
      "condition": "data.status === 'error'",
      "props": { "className": "px-2 py-1 rounded bg-red-100 text-red-800" },
      "children": ["失败"]
    }
  ]
}`} />
      </div>
    ),
  },
  bestPractices: {
    content: (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">1. 保持简单</h4>
        <p>每个组件专注于单一功能，避免过于复杂的嵌套。</p>

        <h4 className="font-medium text-foreground">2. 语义化类名</h4>
        <p>使用 bg-primary、text-muted-foreground 等语义化颜色。</p>

        <h4 className="font-medium text-foreground">3. 组织数据</h4>
        <CodeBlock code={`{
  "data": {
    "form": { "name": "", "email": "" },
    "ui": { "isLoading": false }
  }
}`} />

        <h4 className="font-medium text-foreground">4. 适当间距</h4>
        <p>使用 space-y-*、gap-* 保持布局一致性。</p>

        <h4 className="font-medium text-foreground">5. 测试状态</h4>
        <p>测试组件在不同数据状态下的表现。</p>
      </div>
    ),
  },
};

export function SchemaDocumentation() {
  const { t, locale } = useTranslation();
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialKey | null>(null);
  const [downloading, setDownloading] = useState(false);

  // 教程列表配置
  const tutorials: TutorialKey[] = ['intro', 'styles', 'data', 'events', 'loop', 'condition', 'bestPractices'];

  // 下载文档
  const handleDownloadDocs = async () => {
    setDownloading(true);
    try {
      const markdown = generateSchemaDocMarkdown(locale);
      const fileName = locale === 'zh' ? 'LoreNote-Schema-规范.md' : 'LoreNote-Schema-Spec.md';
      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
      if (filePath) {
        await writeTextFile(filePath, markdown);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  // 显示教程详情
  if (selectedTutorial) {
    const tutorialKeys = t.developerTools.docs.tutorials;
    const title = tutorialKeys[selectedTutorial] as string;
    const Icon = tutorialIcons[selectedTutorial];

    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-6 px-2 text-[11px]"
          onClick={() => setSelectedTutorial(null)}
        >
          <ArrowLeft size={12} />
          {t.common.back}
        </Button>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Icon size={14} className="text-primary" />
            <h3 className="text-xs font-medium text-foreground">{title}</h3>
          </div>
          <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">
            {tutorialContents[selectedTutorial].content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 下载文档按钮 */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 h-8 text-xs"
        onClick={handleDownloadDocs}
        disabled={downloading}
      >
        <Download size={14} />
        {downloading ? t.developerTools.docs.downloading : t.developerTools.docs.downloadDocs}
      </Button>

      {/* Schema 语法参考 */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Code size={12} className="text-primary" />
          <h3 className="text-xs font-medium text-foreground">
            {t.developerTools.docs.schemaReference}
          </h3>
        </div>
        <div className="px-3">
          {/* 基础结构 */}
          <CollapsibleSection
            title={t.developerTools.docs.sections.basicStructure}
            defaultOpen={true}
          >
            <ul className="list-disc pl-4 space-y-0.5">
              <li><code className="text-primary">element</code>: HTML 标签或别名（必填）</li>
              <li><code className="text-primary">id</code>: 组件 ID（交互组件必填）</li>
              <li><code className="text-primary">props</code>: 属性配置</li>
              <li><code className="text-primary">style</code>: 样式配置</li>
              <li><code className="text-primary">data</code>: 组件状态数据</li>
              <li><code className="text-primary">events</code>: 事件处理表达式</li>
              <li><code className="text-primary">children</code>: 子元素</li>
              <li><code className="text-primary">condition</code>: 条件渲染表达式</li>
              <li><code className="text-primary">loop</code>: 循环渲染配置</li>
            </ul>
            <CodeBlock code={`{
  "element": "div",
  "id": "my-component",
  "props": { "className": "p-4" },
  "data": { "count": 0 },
  "children": ["Hello"]
}`} />
          </CollapsibleSection>

          {/* 元素别名 */}
          <CollapsibleSection title={t.developerTools.docs.sections.elementAlias}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <div><code className="text-primary">box</code> → div</div>
              <div><code className="text-primary">text</code> → span</div>
              <div><code className="text-primary">input</code> → input</div>
              <div><code className="text-primary">button</code> → button</div>
              <div><code className="text-primary">image</code> → img</div>
              <div><code className="text-primary">link</code> → a</div>
            </div>
          </CollapsibleSection>

          {/* 表达式语法 */}
          <CollapsibleSection title={t.developerTools.docs.sections.expression}>
            <p className="mb-2">使用 <code className="text-primary">${'{}'}</code> 包裹表达式：</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>数据绑定：<code className="text-primary">${'{data.name}'}</code></li>
              <li>属性引用：<code className="text-primary">${'{props.value}'}</code></li>
              <li>条件判断：<code className="text-primary">${'{a ? b : c}'}</code></li>
              <li>比较运算：<code className="text-primary">${'{a > b}'}</code>, <code className="text-primary">${'{a === b}'}</code></li>
              <li>逻辑运算：<code className="text-primary">${'{a && b}'}</code>, <code className="text-primary">${'{!a}'}</code></li>
              <li>数学运算：<code className="text-primary">${'{a + b}'}</code>, <code className="text-primary">${'{a * b}'}</code></li>
              <li>方法调用：<code className="text-primary">${'{value.toFixed(2)}'}</code></li>
              <li>数组聚合：<code className="text-primary">${'{items.reduce(...)}'}</code></li>
            </ul>
            <CodeBlock code={`// 计算总价
"children": ["\${(data.price * data.qty).toFixed(2)}"]

// 条件样式
"className": "\${data.active ? 'bg-primary' : 'bg-muted'}"

// 数组求和
"\${data.items.reduce((s, i) => s + i.value, 0)}"`} />
          </CollapsibleSection>

          {/* 数据绑定 */}
          <CollapsibleSection title={t.developerTools.docs.sections.dataBinding}>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><code className="text-primary">data</code>: 定义组件内部状态</li>
              <li>支持：字符串、数字、布尔值、数组、对象</li>
            </ul>
            <CodeBlock code={`{
  "data": {
    "name": "",
    "count": 0,
    "active": false,
    "items": [{ "id": "1", "text": "任务" }]
  },
  "children": ["你好, \${data.name}!"]
}`} />
          </CollapsibleSection>

          {/* 交互逻辑 */}
          <CollapsibleSection title={t.developerTools.docs.sections.interaction}>
            <p className="mb-2 font-medium text-amber-600">⚠️ 事件类型选择很重要：</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><code className="text-primary">input</code> - 文本输入框（实时响应）</li>
              <li><code className="text-primary">change</code> - 复选框/单选框</li>
              <li><code className="text-primary">click</code> - 按钮点击</li>
              <li><code className="text-primary">focus/blur</code> - 聚焦/失焦</li>
            </ul>
            <CodeBlock code={`// 输入框 - 用 input 事件
"events": { "input": "data.name = event.target.value" }

// 复选框 - 用 change 事件
"events": { "change": "data.done = event.target.checked" }

// 按钮 - 用 click 事件
"events": { "click": "data.count = data.count + 1" }

// 数组添加项 - 用 $newId 生成唯一 ID
"events": { "click": "data.items.push({ id: $newId, text: '' })" }

// 数组删除项 - 在循环中用 idx
"events": { "click": "data.items.splice(idx, 1)" }`} />
          </CollapsibleSection>

          {/* 上下文变量 */}
          <CollapsibleSection title={t.developerTools.docs.sections.contextVariables}>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><code className="text-primary">event.target.value</code> - 输入框的值</li>
              <li><code className="text-primary">event.target.checked</code> - 复选框状态</li>
              <li><code className="text-primary">$newId</code> - 运行时生成唯一 ID</li>
              <li><code className="text-primary">idx / $index</code> - 循环索引</li>
              <li><code className="text-primary">item</code> - 循环当前项</li>
              <li><code className="text-primary">$first / $last</code> - 是否首项/末项</li>
            </ul>
          </CollapsibleSection>

          {/* 循环渲染 */}
          <CollapsibleSection title={t.developerTools.docs.sections.loopRender}>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><code className="text-primary">items</code>: 数据源表达式</li>
              <li><code className="text-primary">itemName</code>: 当前项变量名（默认 item）</li>
              <li><code className="text-primary">indexName</code>: 索引变量名（默认 index）</li>
            </ul>
            <CodeBlock code={`{
  "element": "div",
  "loop": {
    "items": "data.items",
    "itemName": "item",
    "indexName": "idx"
  },
  "children": ["\${idx + 1}. \${item.name}"]
}`} />
          </CollapsibleSection>

          {/* 条件渲染 */}
          <CollapsibleSection title={t.developerTools.docs.sections.conditionalRender}>
            <p className="mb-2">使用 <code className="text-primary">condition</code> 控制元素显示：</p>
            <CodeBlock code={`// 布尔条件
{ "condition": "data.show", ... }

// 比较条件
{ "condition": "data.count > 0", ... }

// 字符串比较
{ "condition": "data.status === 'success'", ... }

// 数组非空
{ "condition": "data.items.length > 0", ... }`} />
          </CollapsibleSection>
        </div>
      </div>

      {/* 开发教程 */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <BookOpen size={12} className="text-primary" />
          <h3 className="text-xs font-medium text-foreground">
            {t.developerTools.docs.tutorialsTitle}
          </h3>
        </div>
        <div className="p-2 space-y-1">
          {tutorials.map((key) => {
            const tutorialKeys = t.developerTools.docs.tutorials;
            const title = tutorialKeys[key] as string;
            const Icon = tutorialIcons[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedTutorial(key)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors text-left"
              >
                <Icon size={12} className="text-primary flex-shrink-0" />
                <span className="text-[11px] font-medium text-foreground truncate">{title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
