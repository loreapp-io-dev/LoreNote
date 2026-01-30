/**
 * 预置组件 JSON Schema 模板
 * 所有组件都是 JSON 定义，通过 schema-renderer 渲染
 */

import type { SchemaComponent } from './types';
import { generateId } from '@/utils/uuid';

// ==================== 基础块 ====================

/** 空块 - 占位块，点击可编辑 */
export function createEmptyBlockSchema(): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    props: {
      'data-block-type': 'empty',
    },
    style: {
      className: 'min-h-[1.5em] w-full py-1 cursor-text',
    },
    data: {},
  };
}

/** 文本块 */
export function createTextSchema(data?: { content?: string }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    props: {
      contentEditable: true,
      'data-placeholder': '输入文字，或按 / 唤起命令...',
    },
    style: {
      className: 'min-h-[1.5em] w-full py-1 outline-none text-foreground empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
    },
    data: { content: data?.content || '' },
    events: { input: 'data.content = event.target.innerText' },
    children: ['${data.content}'],
  };
}

/** 标题块 */
export function createHeadingSchema(data?: { content?: string; level?: 1 | 2 | 3 }): SchemaComponent {
  const level = data?.level || 1;
  const sizeClass = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl';

  return {
    element: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3',
    id: generateId(),
    props: {
      contentEditable: true,
      'data-placeholder': `标题 ${level}`,
    },
    style: {
      className: `${sizeClass} font-bold py-1 outline-none text-foreground empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]`,
    },
    data: { content: data?.content || '', level },
    events: { input: 'data.content = event.target.innerText' },
    children: ['${data.content}'],
  };
}

/** 分隔线块 */
export function createDividerSchema(): SchemaComponent {
  return {
    element: 'hr',
    id: generateId(),
    style: { className: 'my-4 border-border' },
  };
}

/** 列表块（通用） */
export function createListSchema(data?: {
  items?: Array<{ id: string; content: string; checked?: boolean }>;
  listType?: 'bullet' | 'numbered' | 'todo';
}): SchemaComponent {
  const listType = data?.listType || 'bullet';
  // 根据类型调用对应的专用函数
  if (listType === 'numbered') {
    return createNumberedListSchema(data);
  } else if (listType === 'todo') {
    return createTodoListSchema(data);
  }
  return createBulletListSchema(data);
}

/** 无序列表块 (Bullet List) */
export function createBulletListSchema(data?: {
  items?: Array<{ id: string; content: string }>;
}): SchemaComponent {
  const defaultItems = [{ id: generateId(), content: '' }];

  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-1' },
    data: {
      items: data?.items || defaultItems,
    },
    children: [
      // 列表项
      {
        element: 'div',
        loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
        style: { className: 'flex items-start gap-2 py-0.5 group' },
        children: [
          // 项目符号
          {
            element: 'span',
            style: { className: 'text-muted-foreground select-none mt-0.5 w-4 text-center shrink-0' },
            children: ['•'],
          },
          // 内容
          {
            element: 'span',
            props: {
              contentEditable: true,
              'data-placeholder': '列表项...',
            },
            style: {
              className: 'flex-1 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
            },
            events: {
              input: 'data.items[idx].content = event.target.innerText',
            },
            children: ['${item.content}'],
          },
          // 添加按钮（仅最后一项显示）
          {
            element: 'button',
            condition: 'idx === data.items.length - 1',
            props: { type: 'button' },
            style: { className: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5 transition-opacity shrink-0' },
            events: { click: 'data.items.push({ id: $newId, content: "" })' },
            children: ['+'],
          },
          // 删除按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 transition-opacity shrink-0' },
            events: { click: 'data.items.splice(idx, 1)' },
            children: ['×'],
          },
        ],
      },
    ],
  };
}

/** 有序列表块 (Numbered List) */
export function createNumberedListSchema(data?: {
  items?: Array<{ id: string; content: string }>;
}): SchemaComponent {
  const defaultItems = [{ id: generateId(), content: '' }];

  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-1' },
    data: {
      items: data?.items || defaultItems,
    },
    children: [
      // 列表项
      {
        element: 'div',
        loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
        style: { className: 'flex items-start gap-2 py-0.5 group' },
        children: [
          // 序号
          {
            element: 'span',
            style: { className: 'text-muted-foreground select-none mt-0.5 min-w-[1.5em] text-right shrink-0' },
            children: ['${idx + 1}.'],
          },
          // 内容
          {
            element: 'span',
            props: {
              contentEditable: true,
              'data-placeholder': '列表项...',
            },
            style: {
              className: 'flex-1 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
            },
            events: {
              input: 'data.items[idx].content = event.target.innerText',
            },
            children: ['${item.content}'],
          },
          // 添加按钮（仅最后一项显示）
          {
            element: 'button',
            condition: 'idx === data.items.length - 1',
            props: { type: 'button' },
            style: { className: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5 transition-opacity shrink-0' },
            events: { click: 'data.items.push({ id: $newId, content: "" })' },
            children: ['+'],
          },
          // 删除按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 transition-opacity shrink-0' },
            events: { click: 'data.items.splice(idx, 1)' },
            children: ['×'],
          },
        ],
      },
    ],
  };
}

/** 待办列表块 (Todo List) */
export function createTodoListSchema(data?: {
  items?: Array<{ id: string; content: string; checked?: boolean }>;
}): SchemaComponent {
  const defaultItems = [{ id: generateId(), content: '', checked: false }];

  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-1' },
    data: {
      items: data?.items || defaultItems,
    },
    children: [
      // 列表项
      {
        element: 'div',
        loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
        style: { className: 'flex items-start gap-2 py-0.5 group' },
        children: [
          // 复选框
          {
            element: 'input',
            props: {
              type: 'checkbox',
              checked: '${item.checked}',
            },
            style: { className: 'mt-1 h-4 w-4 rounded border-border cursor-pointer shrink-0' },
            events: { change: 'data.items[idx].checked = !item.checked' },
          },
          // 内容
          {
            element: 'span',
            props: {
              contentEditable: true,
              'data-placeholder': '待办事项...',
            },
            style: {
              className: 'flex-1 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
              conditional: [
                { condition: 'item.checked', className: 'text-muted-foreground line-through' },
              ],
            },
            events: {
              input: 'data.items[idx].content = event.target.innerText',
            },
            children: ['${item.content}'],
          },
          // 添加按钮（仅最后一项显示）
          {
            element: 'button',
            condition: 'idx === data.items.length - 1',
            props: { type: 'button' },
            style: { className: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5 transition-opacity shrink-0' },
            events: { click: 'data.items.push({ id: $newId, content: "", checked: false })' },
            children: ['+'],
          },
          // 删除按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 transition-opacity shrink-0' },
            events: { click: 'data.items.splice(idx, 1)' },
            children: ['×'],
          },
        ],
      },
    ],
  };
}

/** 引用块 */
export function createQuoteSchema(data?: { content?: string }): SchemaComponent {
  return {
    element: 'blockquote',
    id: generateId(),
    props: {
      contentEditable: true,
      'data-placeholder': '输入引用内容...',
    },
    style: {
      className: 'border-l-4 border-border pl-4 py-1 italic text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)]',
    },
    data: { content: data?.content || '' },
    events: { input: 'data.content = event.target.innerText' },
    children: ['${data.content}'],
  };
}

/** 标注块 */
export function createCalloutSchema(data?: { content?: string; type?: 'info' | 'warning' | 'error' | 'success' }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-2' },
    data: {
      content: data?.content || '',
      type: data?.type || 'info',
      isEditing: true, // 是否在编辑模式
    },
    children: [
      // 编辑模式：显示类型选择和内容输入
      {
        element: 'div',
        condition: 'data.isEditing',
        style: { className: 'flex flex-col gap-2 p-3 rounded-md border border-dashed border-border' },
        children: [
          // 类型选择
          {
            element: 'div',
            style: { className: 'flex items-center gap-2' },
            children: [
              {
                element: 'span',
                style: { className: 'text-muted-foreground shrink-0 w-16 text-xs' },
                children: ['类型'],
              },
              {
                element: 'div',
                style: { className: 'flex gap-1' },
                children: [
                  // Info 按钮
                  {
                    element: 'button',
                    props: { type: 'button' },
                    style: {
                      className: 'px-2 py-1 text-xs rounded transition-colors',
                      conditional: [
                        { condition: "data.type === 'info'", className: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
                        { condition: "data.type !== 'info'", className: 'bg-muted text-muted-foreground hover:bg-muted/80' },
                      ],
                    },
                    events: { click: "data.type = 'info'" },
                    children: ['ℹ️ 信息'],
                  },
                  // Warning 按钮
                  {
                    element: 'button',
                    props: { type: 'button' },
                    style: {
                      className: 'px-2 py-1 text-xs rounded transition-colors',
                      conditional: [
                        { condition: "data.type === 'warning'", className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
                        { condition: "data.type !== 'warning'", className: 'bg-muted text-muted-foreground hover:bg-muted/80' },
                      ],
                    },
                    events: { click: "data.type = 'warning'" },
                    children: ['⚠️ 警告'],
                  },
                  // Error 按钮
                  {
                    element: 'button',
                    props: { type: 'button' },
                    style: {
                      className: 'px-2 py-1 text-xs rounded transition-colors',
                      conditional: [
                        { condition: "data.type === 'error'", className: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
                        { condition: "data.type !== 'error'", className: 'bg-muted text-muted-foreground hover:bg-muted/80' },
                      ],
                    },
                    events: { click: "data.type = 'error'" },
                    children: ['❌ 错误'],
                  },
                  // Success 按钮
                  {
                    element: 'button',
                    props: { type: 'button' },
                    style: {
                      className: 'px-2 py-1 text-xs rounded transition-colors',
                      conditional: [
                        { condition: "data.type === 'success'", className: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
                        { condition: "data.type !== 'success'", className: 'bg-muted text-muted-foreground hover:bg-muted/80' },
                      ],
                    },
                    events: { click: "data.type = 'success'" },
                    children: ['✅ 成功'],
                  },
                ],
              },
            ],
          },
          // 内容输入
          {
            element: 'div',
            style: { className: 'flex items-start gap-2' },
            children: [
              {
                element: 'span',
                style: { className: 'text-muted-foreground shrink-0 w-16 text-xs pt-1' },
                children: ['内容'],
              },
              {
                element: 'div',
                props: {
                  contentEditable: true,
                  'data-placeholder': '输入提示内容...',
                },
                style: { className: 'flex-1 min-h-[2em] outline-none text-sm empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]' },
                events: { input: 'data.content = event.target.innerText' },
                children: ['${data.content}'],
              },
            ],
          },
          // 确认按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'self-end px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90' },
            events: { click: 'data.isEditing = false' },
            children: ['确认'],
          },
        ],
      },
      // 展示模式：显示标注卡片
      {
        element: 'div',
        condition: '!data.isEditing && data.content',
        style: {
          className: 'flex gap-3 rounded-lg border p-4 cursor-pointer group',
          conditional: [
            { condition: "data.type === 'info'", className: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' },
            { condition: "data.type === 'warning'", className: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' },
            { condition: "data.type === 'error'", className: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' },
            { condition: "data.type === 'success'", className: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' },
          ],
        },
        events: { dblclick: 'data.isEditing = true' },
        children: [
          // 图标（根据类型动态显示）
          {
            element: 'span',
            condition: "data.type === 'info'",
            style: { className: 'text-lg shrink-0' },
            children: ['ℹ️'],
          },
          {
            element: 'span',
            condition: "data.type === 'warning'",
            style: { className: 'text-lg shrink-0' },
            children: ['⚠️'],
          },
          {
            element: 'span',
            condition: "data.type === 'error'",
            style: { className: 'text-lg shrink-0' },
            children: ['❌'],
          },
          {
            element: 'span',
            condition: "data.type === 'success'",
            style: { className: 'text-lg shrink-0' },
            children: ['✅'],
          },
          // 内容
          {
            element: 'div',
            style: { className: 'flex-1 text-sm' },
            children: ['${data.content}'],
          },
        ],
      },
      // 空状态提示
      {
        element: 'div',
        condition: '!data.isEditing && !data.content',
        style: { className: 'flex items-center gap-2 text-muted-foreground cursor-pointer p-3 rounded-lg border border-dashed border-border hover:bg-muted/50' },
        events: { click: 'data.isEditing = true' },
        children: [
          {
            element: 'span',
            children: ['💡'],
          },
          {
            element: 'span',
            style: { className: 'text-sm' },
            children: ['点击添加标注内容'],
          },
        ],
      },
    ],
  };
}

/** 代码块 */
export function createCodeSchema(data?: { code?: string; language?: string }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-2 rounded-lg bg-muted overflow-hidden' },
    data: { code: data?.code || '', language: data?.language || 'javascript' },
    children: [
      {
        element: 'div',
        style: { className: 'flex items-center justify-between px-4 py-2 border-b border-border text-xs text-muted-foreground' },
        children: [
          { element: 'span', children: ['${data.language}'] },
        ],
      },
      {
        element: 'pre',
        style: { className: 'p-4 overflow-x-auto' },
        children: [
          {
            element: 'code',
            props: { contentEditable: true },
            style: { className: 'text-sm font-mono outline-none block' },
            events: { input: 'data.code = event.target.innerText' },
            children: ['${data.code}'],
          },
        ],
      },
    ],
  };
}

/** 图片块 */
export function createImageSchema(data?: { src?: string; caption?: string }): SchemaComponent {
  return {
    element: 'figure',
    id: generateId(),
    style: { className: 'my-4' },
    data: { src: data?.src || '', caption: data?.caption || '' },
    children: [
      {
        element: 'div',
        condition: '!data.src',
        style: { className: 'flex items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/80' },
        children: [
          {
            element: 'span',
            style: { className: 'text-muted-foreground' },
            children: ['点击上传图片'],
          },
        ],
      },
      {
        element: 'img',
        condition: 'data.src',
        props: { src: '${data.src}', alt: '${data.caption}' },
        style: { className: 'max-w-full rounded-lg' },
      },
      {
        element: 'figcaption',
        condition: 'data.src',
        props: { contentEditable: true, 'data-placeholder': '添加图片说明...' },
        style: { className: 'mt-2 text-center text-sm text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)]' },
        children: ['${data.caption}'],
      },
    ],
  };
}

/** 折叠块 */
export function createToggleSchema(data?: { title?: string; isOpen?: boolean }): SchemaComponent {
  return {
    element: 'details',
    id: generateId(),
    props: { open: '${data.isOpen}' },
    style: { className: 'py-1' },
    data: { title: data?.title || '', isOpen: data?.isOpen ?? true },
    children: [
      {
        element: 'summary',
        props: { contentEditable: true, 'data-placeholder': '折叠标题...' },
        style: { className: 'cursor-pointer outline-none list-none flex items-center gap-2 empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]' },
        events: { input: 'data.title = event.target.innerText' },
        children: ['${data.title}'],
      },
      {
        element: 'div',
        style: { className: 'pl-6 pt-2' },
        children: ['折叠内容区域'],
      },
    ],
  };
}

// ==================== 表格 ====================

/** 表格块 */
export function createTableSchema(data?: {
  rows?: Array<{ id: string; cells: Array<{ id: string; content: string }> }>;
  hasHeader?: boolean;
}): SchemaComponent {
  const columnCount = 3;
  const defaultRows = Array.from({ length: 3 }, () => ({
    id: generateId(),
    cells: Array.from({ length: columnCount }, () => ({ id: generateId(), content: '' })),
  }));

  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-2 overflow-x-auto' },
    data: {
      rows: data?.rows || defaultRows,
      hasHeader: data?.hasHeader ?? true,
    },
    children: [
      {
        element: 'table',
        style: { className: 'w-full border-collapse' },
        children: [
          {
            element: 'tbody',
            children: [
              {
                element: 'tr',
                loop: { items: 'data.rows', itemName: 'row', indexName: 'rowIndex' },
                children: [
                  {
                    element: 'td',
                    loop: { items: 'row.cells', itemName: 'cell', indexName: 'cellIndex' },
                    props: { contentEditable: true },
                    style: {
                      className: 'border border-border px-3 py-2 text-left outline-none min-w-[100px]',
                      conditional: [
                        { condition: 'rowIndex === 0 && data.hasHeader', className: 'bg-muted font-medium' },
                      ],
                    },
                    events: {
                      input: 'data.rows[rowIndex].cells[cellIndex].content = event.target.innerText',
                      blur: 'data.rows[rowIndex].cells[cellIndex].content = event.target.innerText',
                    },
                    children: ['${cell.content}'],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// ==================== 高级块 ====================

/** 单选列表块 */
export function createRadioListSchema(data?: {
  items?: Array<{ id: string; content: string }>;
  selectedId?: string | null;
}): SchemaComponent {
  const id = generateId();
  const defaultItems = [
    { id: generateId(), content: '选项 1' },
    { id: generateId(), content: '选项 2' },
  ];

  return {
    element: 'div',
    id,
    style: { className: 'py-1 space-y-1' },
    data: {
      items: data?.items || defaultItems,
      selectedId: data?.selectedId || null,
    },
    children: [
      {
        element: 'label',
        loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
        style: { className: 'flex items-center gap-2 py-0.5 cursor-pointer' },
        children: [
          {
            element: 'input',
            props: {
              type: 'radio',
              name: `radio-${id}`,
              checked: '${data.selectedId === item.id}',
            },
            style: { className: 'h-4 w-4 border-border text-primary' },
            events: { change: 'data.selectedId = item.id' },
          },
          {
            element: 'span',
            props: { contentEditable: true },
            style: { className: 'flex-1 outline-none' },
            events: {
              input: 'data.items[idx].content = event.target.innerText',
              blur: 'data.items[idx].content = event.target.innerText',
            },
            children: ['${item.content}'],
          },
        ],
      },
    ],
  };
}

/** 多选列表块 */
export function createCheckboxListSchema(data?: {
  items?: Array<{ id: string; content: string; checked: boolean }>;
}): SchemaComponent {
  const defaultItems = [
    { id: generateId(), content: '选项 1', checked: false },
    { id: generateId(), content: '选项 2', checked: false },
  ];

  return {
    element: 'div',
    id: generateId(),
    style: { className: 'py-1 space-y-1' },
    data: {
      items: data?.items || defaultItems,
    },
    children: [
      {
        element: 'label',
        loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
        style: { className: 'flex items-center gap-2 py-0.5 cursor-pointer' },
        children: [
          {
            element: 'input',
            props: {
              type: 'checkbox',
              checked: '${item.checked}',
            },
            style: { className: 'h-4 w-4 rounded border-border text-primary' },
            events: { change: 'data.items[idx].checked = !item.checked' },
          },
          {
            element: 'span',
            props: { contentEditable: true },
            style: {
              className: 'flex-1 outline-none',
              conditional: [
                { condition: 'item.checked', className: 'text-muted-foreground line-through' },
              ],
            },
            events: {
              input: 'data.items[idx].content = event.target.innerText',
              blur: 'data.items[idx].content = event.target.innerText',
            },
            children: ['${item.content}'],
          },
        ],
      },
    ],
  };
}

// ==================== 媒体块 ====================

/** 视频块 */
export function createVideoSchema(data?: { src?: string; caption?: string }): SchemaComponent {
  return {
    element: 'figure',
    id: generateId(),
    style: { className: 'my-4' },
    data: { src: data?.src || '', caption: data?.caption || '' },
    children: [
      // 无视频时显示上传区域
      {
        element: 'div',
        condition: '!data.src',
        style: { className: 'flex flex-col items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/80' },
        children: [
          {
            element: 'span',
            style: { className: 'text-2xl mb-2' },
            children: ['🎬'],
          },
          {
            element: 'span',
            style: { className: 'text-muted-foreground' },
            children: ['点击上传视频'],
          },
        ],
      },
      // 有视频时显示 video 标签
      {
        element: 'video',
        condition: 'data.src',
        props: { src: '${data.src}', controls: true },
        style: { className: 'max-w-full rounded-lg' },
      },
      // 说明文字
      {
        element: 'figcaption',
        condition: 'data.src',
        props: { contentEditable: true, 'data-placeholder': '添加视频说明...' },
        style: { className: 'mt-2 text-center text-sm text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)]' },
        children: ['${data.caption}'],
      },
    ],
  };
}

/** 音频块 */
export function createAudioSchema(data?: { src?: string; title?: string }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-4' },
    data: { src: data?.src || '', title: data?.title || '' },
    children: [
      // 无音频时显示上传区域
      {
        element: 'div',
        condition: '!data.src',
        style: { className: 'flex flex-col items-center justify-center h-24 bg-muted rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/80' },
        children: [
          {
            element: 'span',
            style: { className: 'text-2xl mb-2' },
            children: ['🎵'],
          },
          {
            element: 'span',
            style: { className: 'text-muted-foreground' },
            children: ['点击上传音频'],
          },
        ],
      },
      // 有音频时显示播放器
      {
        element: 'div',
        condition: 'data.src',
        style: { className: 'flex items-center gap-3 p-3 bg-muted rounded-lg' },
        children: [
          {
            element: 'span',
            style: { className: 'text-2xl' },
            children: ['🎵'],
          },
          {
            element: 'div',
            style: { className: 'flex-1' },
            children: [
              {
                element: 'div',
                props: { contentEditable: true, 'data-placeholder': '音频标题...' },
                style: { className: 'font-medium outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]' },
                children: ['${data.title}'],
              },
              {
                element: 'audio',
                props: { src: '${data.src}', controls: true },
                style: { className: 'w-full mt-2' },
              },
            ],
          },
        ],
      },
    ],
  };
}

/** 文件块 */
export function createFileSchema(data?: { src?: string; name?: string; size?: number }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-4' },
    data: { src: data?.src || '', name: data?.name || '', size: data?.size || 0 },
    children: [
      // 无文件时显示上传区域
      {
        element: 'div',
        condition: '!data.src',
        style: { className: 'flex flex-col items-center justify-center h-24 bg-muted rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/80' },
        children: [
          {
            element: 'span',
            style: { className: 'text-2xl mb-2' },
            children: ['📎'],
          },
          {
            element: 'span',
            style: { className: 'text-muted-foreground' },
            children: ['点击上传文件'],
          },
        ],
      },
      // 有文件时显示文件卡片
      {
        element: 'a',
        condition: 'data.src',
        props: { href: '${data.src}', download: true },
        style: { className: 'flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors no-underline' },
        children: [
          {
            element: 'span',
            style: { className: 'text-2xl' },
            children: ['📄'],
          },
          {
            element: 'div',
            style: { className: 'flex-1 min-w-0' },
            children: [
              {
                element: 'div',
                style: { className: 'font-medium text-foreground truncate' },
                children: ['${data.name || "未命名文件"}'],
              },
              {
                element: 'div',
                style: { className: 'text-xs text-muted-foreground' },
                children: ['${data.size > 0 ? (data.size / 1024).toFixed(1) + " KB" : "点击下载"}'],
              },
            ],
          },
        ],
      },
    ],
  };
}

// ==================== 嵌入块 ====================

/** 书签块 */
export function createBookmarkSchema(data?: { url?: string; title?: string; description?: string; image?: string }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-4' },
    data: { url: data?.url || '', title: data?.title || '', description: data?.description || '', image: data?.image || '' },
    children: [
      // 无 URL 时显示输入框
      {
        element: 'div',
        condition: '!data.url',
        style: { className: 'flex items-center gap-2 p-3 bg-muted rounded-lg border border-border' },
        children: [
          {
            element: 'span',
            style: { className: 'text-muted-foreground' },
            children: ['🔗'],
          },
          {
            element: 'input',
            props: { type: 'url', placeholder: '输入网址，按回车确认...', 'data-placeholder': '输入网址...' },
            style: { className: 'flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground' },
            events: { keydown: 'if (event.key === "Enter") { data.url = event.target.value; data.title = event.target.value; }' },
          },
        ],
      },
      // 有 URL 时显示书签卡片
      {
        element: 'a',
        condition: 'data.url',
        props: { href: '${data.url}', target: '_blank', rel: 'noopener noreferrer' },
        style: { className: 'flex items-stretch bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors no-underline' },
        children: [
          // 左侧内容
          {
            element: 'div',
            style: { className: 'flex-1 p-4 min-w-0' },
            children: [
              {
                element: 'div',
                style: { className: 'font-medium text-foreground line-clamp-1' },
                children: ['${data.title || data.url}'],
              },
              {
                element: 'div',
                condition: 'data.description',
                style: { className: 'text-sm text-muted-foreground mt-1 line-clamp-2' },
                children: ['${data.description}'],
              },
              {
                element: 'div',
                style: { className: 'text-xs text-muted-foreground mt-2 truncate' },
                children: ['${data.url}'],
              },
            ],
          },
          // 右侧预览图
          {
            element: 'div',
            condition: 'data.image',
            style: { className: 'w-32 flex-shrink-0 bg-muted' },
            children: [
              {
                element: 'img',
                props: { src: '${data.image}', alt: '' },
                style: { className: 'w-full h-full object-cover' },
              },
            ],
          },
        ],
      },
    ],
  };
}

/** 页面链接块 */
export function createLinkSchema(data?: { targetId?: string; text?: string }): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-2' },
    data: { targetId: data?.targetId || '', text: data?.text || '' },
    children: [
      // 无链接时显示选择提示
      {
        element: 'div',
        condition: '!data.targetId',
        style: { className: 'flex items-center gap-2 p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80' },
        children: [
          {
            element: 'span',
            style: { className: 'text-muted-foreground' },
            children: ['🔗'],
          },
          {
            element: 'span',
            style: { className: 'text-sm text-muted-foreground' },
            children: ['点击选择要链接的页面...'],
          },
        ],
      },
      // 有链接时显示链接卡片
      {
        element: 'div',
        condition: 'data.targetId',
        style: { className: 'flex items-center gap-2 p-2 bg-muted rounded-md cursor-pointer hover:bg-accent transition-colors' },
        children: [
          {
            element: 'span',
            style: { className: 'text-primary' },
            children: ['📄'],
          },
          {
            element: 'span',
            props: { contentEditable: true, 'data-placeholder': '链接文字...' },
            style: { className: 'flex-1 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]' },
            children: ['${data.text || "链接到页面"}'],
          },
        ],
      },
    ],
  };
}

/** 笔记链接块 - 链接到仓库内的其他页面 */
export function createNoteLinkSchema(data?: {
  targetPageId?: string;
  title?: string;
}): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-2' },
    data: {
      targetPageId: data?.targetPageId || '',
      title: data?.title || '',
      isEditing: true, // 是否在编辑模式
    },
    children: [
      // 编辑模式：显示两行输入
      {
        element: 'div',
        condition: 'data.isEditing',
        style: { className: 'flex flex-col gap-2 p-3 rounded-md border border-dashed border-border' },
        children: [
          // 页面 ID 输入
          {
            element: 'div',
            style: { className: 'flex items-center gap-2' },
            children: [
              {
                element: 'span',
                style: { className: 'text-muted-foreground shrink-0 w-16 text-xs' },
                children: ['页面'],
              },
              {
                element: 'select',
                props: {
                  value: '${data.targetPageId}',
                },
                style: { className: 'flex-1 bg-background text-foreground text-sm border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer' },
                events: {
                  change: 'data.targetPageId = event.target.value; data.title = event.target.selectedOptions[0]?.text || ""',
                },
                children: [
                  {
                    element: 'option',
                    props: { value: '' },
                    children: ['选择页面...'],
                  },
                  {
                    element: 'option',
                    loop: { items: 'data.$pages || []', itemName: 'page' },
                    props: { value: '${page.id}' },
                    children: ['${page.title}'],
                  },
                ],
              },
            ],
          },
          // 显示名称输入
          {
            element: 'div',
            style: { className: 'flex items-center gap-2' },
            children: [
              {
                element: 'span',
                style: { className: 'text-muted-foreground shrink-0 w-16 text-xs' },
                children: ['显示名称'],
              },
              {
                element: 'input',
                props: {
                  type: 'text',
                  placeholder: '输入显示的标题（可选）',
                  defaultValue: '${data.title}',
                },
                style: { className: 'flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground' },
                events: {
                  input: 'data.title = event.target.value',
                },
              },
            ],
          },
          // 确认按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'self-end px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90' },
            events: {
              click: 'data.isEditing = false',
            },
            children: ['确认'],
          },
        ],
      },
      // 展示模式：显示紧凑卡片
      {
        element: 'div',
        condition: '!data.isEditing && data.targetPageId',
        props: { 'data-link-type': 'note', 'data-target': '${data.targetPageId}' },
        style: { className: 'flex items-center gap-2 cursor-pointer group' },
        events: {
          dblclick: 'data.isEditing = true',
        },
        children: [
          {
            element: 'span',
            style: { className: 'shrink-0' },
            children: ['📄'],
          },
          {
            element: 'span',
            style: { className: 'text-sm text-blue-500 hover:text-blue-600 hover:underline' },
            children: ['${data.title || data.targetPageId}'],
          },
        ],
      },
      // 空状态提示
      {
        element: 'div',
        condition: '!data.isEditing && !data.targetPageId',
        style: { className: 'flex items-center gap-2 text-muted-foreground cursor-pointer' },
        events: {
          click: 'data.isEditing = true',
        },
        children: [
          {
            element: 'span',
            children: ['📄'],
          },
          {
            element: 'span',
            style: { className: 'text-sm' },
            children: ['点击设置笔记链接'],
          },
        ],
      },
    ],
  };
}

/** 网页链接块 - 链接到外部网站 */
export function createWebLinkSchema(data?: {
  url?: string;
  title?: string;
}): SchemaComponent {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-2' },
    data: {
      url: data?.url || '',
      title: data?.title || '',
      isEditing: true, // 是否在编辑模式
    },
    children: [
      // 编辑模式：显示两行输入
      {
        element: 'div',
        condition: 'data.isEditing',
        style: { className: 'flex flex-col gap-2 p-3 rounded-md border border-dashed border-border' },
        children: [
          // URL 输入
          {
            element: 'div',
            style: { className: 'flex items-center gap-2' },
            children: [
              {
                element: 'span',
                style: { className: 'text-muted-foreground shrink-0 w-16 text-xs' },
                children: ['网址'],
              },
              {
                element: 'input',
                props: {
                  type: 'url',
                  placeholder: 'https://example.com',
                  defaultValue: '${data.url}',
                },
                style: { className: 'flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground' },
                events: {
                  input: 'data.url = event.target.value',
                },
              },
            ],
          },
          // 显示名称输入
          {
            element: 'div',
            style: { className: 'flex items-center gap-2' },
            children: [
              {
                element: 'span',
                style: { className: 'text-muted-foreground shrink-0 w-16 text-xs' },
                children: ['显示名称'],
              },
              {
                element: 'input',
                props: {
                  type: 'text',
                  placeholder: '输入显示的标题（可选）',
                  defaultValue: '${data.title}',
                },
                style: { className: 'flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground' },
                events: {
                  input: 'data.title = event.target.value',
                },
              },
            ],
          },
          // 确认按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'self-end px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90' },
            events: {
              click: 'data.isEditing = false',
            },
            children: ['确认'],
          },
        ],
      },
      // 展示模式：显示紧凑卡片（可点击打开）
      {
        element: 'a',
        condition: '!data.isEditing && data.url',
        props: {
          href: '${data.url}',
          target: '_blank',
          rel: 'noopener noreferrer',
          'data-link-type': 'web',
        },
        style: { className: 'flex items-center gap-2 cursor-pointer no-underline group' },
        children: [
          {
            element: 'span',
            style: { className: 'shrink-0' },
            children: ['🔗'],
          },
          {
            element: 'span',
            style: { className: 'text-sm text-blue-500 hover:text-blue-600 hover:underline' },
            children: ['${data.title || data.url}'],
          },
        ],
      },
      // 编辑按钮（悬停显示）
      {
        element: 'button',
        condition: '!data.isEditing && data.url',
        props: { type: 'button' },
        style: { className: 'ml-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity' },
        events: {
          click: 'data.isEditing = true',
        },
        children: ['编辑'],
      },
      // 空状态提示
      {
        element: 'div',
        condition: '!data.isEditing && !data.url',
        style: { className: 'flex items-center gap-2 text-muted-foreground cursor-pointer' },
        events: {
          click: 'data.isEditing = true',
        },
        children: [
          {
            element: 'span',
            children: ['🔗'],
          },
          {
            element: 'span',
            style: { className: 'text-sm' },
            children: ['点击设置网页链接'],
          },
        ],
      },
    ],
  };
}

// ==================== 示例组件 ====================

/** 价格计算器（表格形式） */
export function createPriceCalculatorSchema(data?: {
  items?: Array<{ id: string; name: string; quantity: number; unitPrice: number }>;
}): SchemaComponent {
  const defaultItems = [
    { id: generateId(), name: '', quantity: 1, unitPrice: 0 },
  ];

  return {
    element: 'div',
    id: generateId(),
    style: { className: 'my-4 rounded-lg border border-border overflow-hidden bg-card' },
    data: {
      items: data?.items || defaultItems,
    },
    children: [
      // 表格
      {
        element: 'table',
        style: { className: 'w-full border-collapse text-sm' },
        children: [
          // 表头
          {
            element: 'thead',
            children: [
              {
                element: 'tr',
                style: { className: 'bg-muted' },
                children: [
                  { element: 'th', style: { className: 'px-3 py-2 text-left font-medium text-muted-foreground' }, children: ['名称'] },
                  { element: 'th', style: { className: 'px-3 py-2 text-left font-medium text-muted-foreground w-24' }, children: ['数量'] },
                  { element: 'th', style: { className: 'px-3 py-2 text-left font-medium text-muted-foreground w-28' }, children: ['单价'] },
                  { element: 'th', style: { className: 'px-3 py-2 text-right font-medium text-muted-foreground w-28' }, children: ['小计'] },
                  { element: 'th', style: { className: 'px-2 py-2 w-10' }, children: [''] },
                ],
              },
            ],
          },
          // 数据行
          {
            element: 'tbody',
            children: [
              {
                element: 'tr',
                loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
                style: { className: 'border-t border-border' },
                children: [
                  // 名称
                  {
                    element: 'td',
                    style: { className: 'px-1 py-1' },
                    children: [
                      {
                        element: 'input',
                        props: { type: 'text', value: '${item.name}', placeholder: '输入名称...' },
                        style: { className: 'w-full px-2 py-1 bg-transparent outline-none focus:bg-background rounded' },
                        events: { input: 'data.items[idx].name = event.target.value' },
                      },
                    ],
                  },
                  // 数量
                  {
                    element: 'td',
                    style: { className: 'px-1 py-1' },
                    children: [
                      {
                        element: 'input',
                        props: { type: 'number', value: '${item.quantity}', min: '0' },
                        style: { className: 'w-full px-2 py-1 bg-transparent outline-none focus:bg-background rounded text-right' },
                        events: { input: 'data.items[idx].quantity = Number(event.target.value) || 0' },
                      },
                    ],
                  },
                  // 单价
                  {
                    element: 'td',
                    style: { className: 'px-1 py-1' },
                    children: [
                      {
                        element: 'input',
                        props: { type: 'number', value: '${item.unitPrice}', min: '0', step: '0.01' },
                        style: { className: 'w-full px-2 py-1 bg-transparent outline-none focus:bg-background rounded text-right' },
                        events: { input: 'data.items[idx].unitPrice = Number(event.target.value) || 0' },
                      },
                    ],
                  },
                  // 小计
                  {
                    element: 'td',
                    style: { className: 'px-3 py-1 text-right text-foreground' },
                    children: ['¥${(item.quantity * item.unitPrice).toFixed(2)}'],
                  },
                  // 删除按钮
                  {
                    element: 'td',
                    style: { className: 'px-1 py-1 text-center' },
                    children: [
                      {
                        element: 'button',
                        props: { type: 'button' },
                        style: { className: 'p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted transition-colors' },
                        events: { click: 'data.items.splice(idx, 1)' },
                        children: ['×'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      // 底部：添加行 + 总计
      {
        element: 'div',
        style: { className: 'flex items-center justify-between px-3 py-2 border-t border-border bg-muted/50' },
        children: [
          // 添加行按钮
          {
            element: 'button',
            props: { type: 'button' },
            style: { className: 'text-sm text-primary hover:text-primary/80 flex items-center gap-1' },
            events: { click: 'data.items.push({ id: $newId, name: "", quantity: 1, unitPrice: 0 })' },
            children: ['+ 添加行'],
          },
          // 总计
          {
            element: 'div',
            style: { className: 'flex items-center gap-2' },
            children: [
              { element: 'span', style: { className: 'text-sm text-muted-foreground' }, children: ['总计:'] },
              { element: 'span', style: { className: 'text-lg font-bold text-primary' }, children: ['¥${data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}'] },
            ],
          },
        ],
      },
    ],
  };
}

// ==================== 模板映射 ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaTemplateFunction = (data?: any) => SchemaComponent;

/** 所有预置 Schema 模板 */
export const schemaTemplates: Record<string, SchemaTemplateFunction> = {
  // 基础块
  text: createTextSchema,
  heading: createHeadingSchema,
  divider: createDividerSchema,
  list: createListSchema,
  'bullet-list': createBulletListSchema,
  'numbered-list': createNumberedListSchema,
  'todo-list': createTodoListSchema,
  quote: createQuoteSchema,
  callout: createCalloutSchema,
  code: createCodeSchema,
  image: createImageSchema,
  toggle: createToggleSchema,
  // 表格
  table: createTableSchema,
  // 媒体块
  video: createVideoSchema,
  audio: createAudioSchema,
  file: createFileSchema,
  // 嵌入块
  bookmark: createBookmarkSchema,
  link: createLinkSchema,
  'note-link': createNoteLinkSchema,
  'web-link': createWebLinkSchema,
  // 高级块
  'radio-list': createRadioListSchema,
  'checkbox-list': createCheckboxListSchema,
  // 示例
  'price-calculator': createPriceCalculatorSchema,
};
