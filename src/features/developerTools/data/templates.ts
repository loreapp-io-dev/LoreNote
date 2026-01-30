import type { ComponentTemplate } from '../types';

/** 预置组件模板 */
export const componentTemplates: ComponentTemplate[] = [
  // 基础组件
  {
    id: 'card',
    name: '卡片',
    description: '带标题和内容的卡片容器',
    category: 'basic',
    icon: 'Square',
    tags: ['card', 'container'],
    schema: {
      element: 'div',
      props: {
        className: 'rounded-lg border border-border bg-card p-4 shadow-sm',
      },
      children: [
        {
          element: 'text',
          props: { className: 'text-lg font-semibold text-foreground' },
          children: ['卡片标题'],
        },
        {
          element: 'text',
          props: { className: 'mt-2 text-sm text-muted-foreground' },
          children: ['这是卡片的内容区域，可以放置任何内容。'],
        },
      ],
    },
  },
  {
    id: 'button',
    name: '按钮',
    description: '可交互按钮',
    category: 'basic',
    icon: 'MousePointer',
    tags: ['button', 'interactive'],
    schema: {
      element: 'button',
      props: {
        className:
          'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90',
      },
      children: ['点击按钮'],
    },
  },
  {
    id: 'input',
    name: '输入框',
    description: '带标签的输入组件',
    category: 'basic',
    icon: 'TextCursor',
    tags: ['input', 'form'],
    schema: {
      element: 'div',
      props: { className: 'space-y-2' },
      data: { value: '' },
      children: [
        {
          element: 'text',
          props: { className: 'text-sm font-medium text-foreground' },
          children: ['输入标签'],
        },
        {
          element: 'input',
          props: {
            type: 'text',
            className:
              'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary',
            placeholder: '请输入内容...',
            value: '${data.value}',
          },
          events: {
            change: 'data.value = event.target.value',
          },
        },
      ],
    },
  },
  {
    id: 'badge',
    name: '徽章',
    description: '状态标签',
    category: 'basic',
    icon: 'Tag',
    tags: ['badge', 'tag', 'status'],
    schema: {
      element: 'text',
      props: {
        className:
          'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary',
      },
      children: ['标签'],
    },
  },
  {
    id: 'image',
    name: '图片',
    description: '带圆角的图片展示',
    category: 'basic',
    icon: 'Image',
    tags: ['image', 'media'],
    schema: {
      element: 'div',
      props: { className: 'overflow-hidden rounded-lg border border-border' },
      children: [
        {
          element: 'image',
          props: {
            src: 'https://picsum.photos/400/200',
            alt: '示例图片',
            className: 'w-full h-auto object-cover',
          },
        },
        {
          element: 'div',
          props: { className: 'p-3 bg-card' },
          children: [
            {
              element: 'text',
              props: { className: 'text-sm text-muted-foreground' },
              children: ['图片描述文字'],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'divider',
    name: '分隔线',
    description: '水平分隔线',
    category: 'basic',
    icon: 'Minus',
    tags: ['divider', 'separator'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-4 py-2' },
      children: [
        {
          element: 'div',
          props: { className: 'flex-1 h-px bg-border' },
        },
        {
          element: 'text',
          props: { className: 'text-xs text-muted-foreground' },
          children: ['分隔文字'],
        },
        {
          element: 'div',
          props: { className: 'flex-1 h-px bg-border' },
        },
      ],
    },
  },
  {
    id: 'avatar',
    name: '头像',
    description: '圆形头像组件',
    category: 'basic',
    icon: 'CircleUser',
    tags: ['avatar', 'user', 'profile'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-3' },
      children: [
        {
          element: 'div',
          props: {
            className: 'flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium',
          },
          children: ['张'],
        },
        {
          element: 'div',
          children: [
            {
              element: 'text',
              props: { className: 'text-sm font-medium text-foreground' },
              children: ['张三'],
            },
            {
              element: 'text',
              props: { className: 'text-xs text-muted-foreground' },
              children: ['产品经理'],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'progress',
    name: '进度条',
    description: '带百分比的进度条',
    category: 'basic',
    icon: 'Activity',
    tags: ['progress', 'bar'],
    schema: {
      element: 'div',
      props: { className: 'space-y-2' },
      data: { value: 65 },
      children: [
        {
          element: 'div',
          props: { className: 'flex items-center justify-between text-sm' },
          children: [
            {
              element: 'text',
              props: { className: 'text-muted-foreground' },
              children: ['进度'],
            },
            {
              element: 'text',
              props: { className: 'font-medium' },
              children: ['${data.value}%'],
            },
          ],
        },
        {
          element: 'div',
          props: { className: 'h-2 w-full overflow-hidden rounded-full bg-muted' },
          children: [
            {
              element: 'div',
              props: {
                className: 'h-full w-[65%] bg-primary transition-all',
              },
            },
          ],
        },
      ],
    },
  },

  // 布局组件
  {
    id: 'grid',
    name: '网格布局',
    description: '响应式网格容器',
    category: 'layout',
    icon: 'Grid3X3',
    tags: ['grid', 'layout'],
    schema: {
      element: 'div',
      props: {
        className: 'grid grid-cols-2 gap-4',
      },
      children: [
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-muted/30 p-4' },
          children: ['网格项 1'],
        },
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-muted/30 p-4' },
          children: ['网格项 2'],
        },
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-muted/30 p-4' },
          children: ['网格项 3'],
        },
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-muted/30 p-4' },
          children: ['网格项 4'],
        },
      ],
    },
  },
  {
    id: 'flex',
    name: '弹性布局',
    description: 'Flex 容器',
    category: 'layout',
    icon: 'Rows3',
    tags: ['flex', 'layout'],
    schema: {
      element: 'div',
      props: {
        className: 'flex items-center gap-4',
      },
      children: [
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-muted/30 px-4 py-2' },
          children: ['左侧'],
        },
        {
          element: 'div',
          props: { className: 'flex-1 rounded-lg border border-border bg-muted/30 px-4 py-2' },
          children: ['中间（自动填充）'],
        },
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-muted/30 px-4 py-2' },
          children: ['右侧'],
        },
      ],
    },
  },
  {
    id: 'columns',
    name: '分栏布局',
    description: '两栏/三栏布局',
    category: 'layout',
    icon: 'Columns3',
    tags: ['columns', 'layout'],
    schema: {
      element: 'div',
      props: {
        className: 'flex gap-4',
      },
      children: [
        {
          element: 'div',
          props: { className: 'w-1/3 rounded-lg border border-border bg-muted/30 p-4' },
          children: ['侧边栏'],
        },
        {
          element: 'div',
          props: { className: 'flex-1 rounded-lg border border-border bg-muted/30 p-4' },
          children: ['主内容区'],
        },
      ],
    },
  },
  {
    id: 'center',
    name: '居中容器',
    description: '内容居中布局',
    category: 'layout',
    icon: 'AlignCenter',
    tags: ['center', 'layout'],
    schema: {
      element: 'div',
      props: { className: 'flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20' },
      children: [
        {
          element: 'div',
          props: { className: 'text-center' },
          children: [
            {
              element: 'text',
              props: { className: 'text-lg font-medium text-foreground' },
              children: ['居中内容'],
            },
            {
              element: 'text',
              props: { className: 'mt-1 text-sm text-muted-foreground' },
              children: ['这是一个居中显示的容器'],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'stack',
    name: '堆叠卡片',
    description: '垂直堆叠的卡片组',
    category: 'layout',
    icon: 'Layers',
    tags: ['stack', 'cards', 'layout'],
    schema: {
      element: 'div',
      props: { className: 'space-y-3' },
      children: [
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-card p-4 shadow-sm' },
          children: [
            {
              element: 'text',
              props: { className: 'font-medium text-foreground' },
              children: ['卡片 1'],
            },
            {
              element: 'text',
              props: { className: 'mt-1 text-sm text-muted-foreground' },
              children: ['第一张卡片的内容'],
            },
          ],
        },
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-card p-4 shadow-sm' },
          children: [
            {
              element: 'text',
              props: { className: 'font-medium text-foreground' },
              children: ['卡片 2'],
            },
            {
              element: 'text',
              props: { className: 'mt-1 text-sm text-muted-foreground' },
              children: ['第二张卡片的内容'],
            },
          ],
        },
        {
          element: 'div',
          props: { className: 'rounded-lg border border-border bg-card p-4 shadow-sm' },
          children: [
            {
              element: 'text',
              props: { className: 'font-medium text-foreground' },
              children: ['卡片 3'],
            },
            {
              element: 'text',
              props: { className: 'mt-1 text-sm text-muted-foreground' },
              children: ['第三张卡片的内容'],
            },
          ],
        },
      ],
    },
  },

  // 交互组件
  {
    id: 'counter',
    name: '计数器',
    description: '带加减按钮的计数器',
    category: 'interactive',
    icon: 'Hash',
    tags: ['counter', 'interactive'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-3' },
      data: { count: 0 },
      children: [
        {
          element: 'button',
          props: {
            className:
              'flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted transition-colors hover:bg-accent',
          },
          events: { click: 'data.count = data.count - 1' },
          children: ['-'],
        },
        {
          element: 'text',
          props: { className: 'min-w-[3rem] text-center text-lg font-medium' },
          children: ['${data.count}'],
        },
        {
          element: 'button',
          props: {
            className:
              'flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted transition-colors hover:bg-accent',
          },
          events: { click: 'data.count = data.count + 1' },
          children: ['+'],
        },
      ],
    },
  },
  {
    id: 'toggle',
    name: '切换开关',
    description: 'Toggle 开关',
    category: 'interactive',
    icon: 'ToggleLeft',
    tags: ['toggle', 'switch', 'interactive'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-3' },
      data: { enabled: false },
      children: [
        {
          element: 'button',
          props: {
            className:
              'relative h-6 w-11 rounded-full transition-colors ${data.enabled ? "bg-primary" : "bg-muted"}',
          },
          events: { click: 'data.enabled = !data.enabled' },
          children: [
            {
              element: 'div',
              props: {
                className:
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.enabled ? "translate-x-5" : "translate-x-0.5"}',
              },
              children: [],
            },
          ],
        },
        {
          element: 'text',
          props: { className: 'text-sm text-muted-foreground' },
          children: ['${data.enabled ? "已开启" : "已关闭"}'],
        },
      ],
    },
  },
  {
    id: 'tabs',
    name: '选项卡',
    description: 'Tab 切换组件',
    category: 'interactive',
    icon: 'LayoutList',
    tags: ['tabs', 'navigation', 'interactive'],
    schema: {
      element: 'div',
      data: { activeTab: 'tab1' },
      children: [
        {
          element: 'div',
          props: { className: 'flex border-b border-border' },
          children: [
            {
              element: 'button',
              props: {
                className:
                  'px-4 py-2 text-sm transition-colors ${data.activeTab === "tab1" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}',
              },
              events: { click: 'data.activeTab = "tab1"' },
              children: ['选项卡 1'],
            },
            {
              element: 'button',
              props: {
                className:
                  'px-4 py-2 text-sm transition-colors ${data.activeTab === "tab2" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}',
              },
              events: { click: 'data.activeTab = "tab2"' },
              children: ['选项卡 2'],
            },
            {
              element: 'button',
              props: {
                className:
                  'px-4 py-2 text-sm transition-colors ${data.activeTab === "tab3" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}',
              },
              events: { click: 'data.activeTab = "tab3"' },
              children: ['选项卡 3'],
            },
          ],
        },
        {
          element: 'div',
          props: { className: 'p-4' },
          children: [
            {
              element: 'text',
              condition: 'data.activeTab === "tab1"',
              children: ['这是选项卡 1 的内容'],
            },
            {
              element: 'text',
              condition: 'data.activeTab === "tab2"',
              children: ['这是选项卡 2 的内容'],
            },
            {
              element: 'text',
              condition: 'data.activeTab === "tab3"',
              children: ['这是选项卡 3 的内容'],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'accordion',
    name: '折叠面板',
    description: '可展开/收起的面板',
    category: 'interactive',
    icon: 'ChevronDown',
    tags: ['accordion', 'collapsible', 'interactive'],
    schema: {
      element: 'div',
      props: { className: 'rounded-lg border border-border' },
      data: { isOpen: false },
      children: [
        {
          element: 'button',
          props: {
            className:
              'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50',
          },
          events: { click: 'data.isOpen = !data.isOpen' },
          children: [
            '折叠面板标题',
            {
              element: 'text',
              props: {
                className: 'transition-transform ${data.isOpen ? "rotate-180" : ""}',
              },
              children: ['▼'],
            },
          ],
        },
        {
          element: 'div',
          condition: 'data.isOpen',
          props: { className: 'border-t border-border px-4 py-3 text-sm text-muted-foreground' },
          children: ['这是折叠面板的内容区域，点击标题可以展开或收起。'],
        },
      ],
    },
  },
  {
    id: 'rating',
    name: '评分组件',
    description: '星级评分',
    category: 'interactive',
    icon: 'Star',
    tags: ['rating', 'stars', 'interactive'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-1' },
      data: { rating: 3 },
      children: [
        {
          element: 'button',
          props: { className: '${data.rating >= 1 ? "text-yellow-400" : "text-muted-foreground"} hover:scale-110 transition-transform' },
          events: { click: 'data.rating = 1' },
          children: ['★'],
        },
        {
          element: 'button',
          props: { className: '${data.rating >= 2 ? "text-yellow-400" : "text-muted-foreground"} hover:scale-110 transition-transform' },
          events: { click: 'data.rating = 2' },
          children: ['★'],
        },
        {
          element: 'button',
          props: { className: '${data.rating >= 3 ? "text-yellow-400" : "text-muted-foreground"} hover:scale-110 transition-transform' },
          events: { click: 'data.rating = 3' },
          children: ['★'],
        },
        {
          element: 'button',
          props: { className: '${data.rating >= 4 ? "text-yellow-400" : "text-muted-foreground"} hover:scale-110 transition-transform' },
          events: { click: 'data.rating = 4' },
          children: ['★'],
        },
        {
          element: 'button',
          props: { className: '${data.rating >= 5 ? "text-yellow-400" : "text-muted-foreground"} hover:scale-110 transition-transform' },
          events: { click: 'data.rating = 5' },
          children: ['★'],
        },
        {
          element: 'text',
          props: { className: 'ml-2 text-sm text-muted-foreground' },
          children: ['${data.rating} / 5'],
        },
      ],
    },
  },
  {
    id: 'stepper',
    name: '步进器',
    description: '步骤进度指示器',
    category: 'interactive',
    icon: 'ListOrdered',
    tags: ['stepper', 'steps', 'interactive'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-2' },
      data: { step: 2 },
      children: [
        {
          element: 'div',
          props: { className: 'flex items-center gap-2' },
          children: [
            {
              element: 'div',
              props: { className: 'flex h-8 w-8 items-center justify-center rounded-full ${data.step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} text-sm font-medium' },
              children: ['1'],
            },
            {
              element: 'div',
              props: { className: 'w-12 h-0.5 ${data.step >= 2 ? "bg-primary" : "bg-muted"}' },
            },
            {
              element: 'div',
              props: { className: 'flex h-8 w-8 items-center justify-center rounded-full ${data.step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} text-sm font-medium' },
              children: ['2'],
            },
            {
              element: 'div',
              props: { className: 'w-12 h-0.5 ${data.step >= 3 ? "bg-primary" : "bg-muted"}' },
            },
            {
              element: 'div',
              props: { className: 'flex h-8 w-8 items-center justify-center rounded-full ${data.step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} text-sm font-medium' },
              children: ['3'],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'search',
    name: '搜索框',
    description: '带图标的搜索输入',
    category: 'interactive',
    icon: 'Search',
    tags: ['search', 'input', 'interactive'],
    schema: {
      element: 'div',
      props: { className: 'relative' },
      data: { query: '' },
      children: [
        {
          element: 'text',
          props: { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' },
          children: ['🔍'],
        },
        {
          element: 'input',
          props: {
            type: 'text',
            className: 'w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary',
            placeholder: '搜索...',
            value: '${data.query}',
          },
          events: { input: 'data.query = event.target.value' },
        },
        {
          element: 'button',
          condition: 'data.query.length > 0',
          props: { className: 'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground' },
          events: { click: 'data.query = ""' },
          children: ['✕'],
        },
      ],
    },
  },

  // 高级组件
  {
    id: 'table',
    name: '表格',
    description: '带数据绑定的表格',
    category: 'advanced',
    icon: 'Table',
    tags: ['table', 'data'],
    schema: {
      element: 'div',
      props: { className: 'overflow-hidden rounded-lg border border-border' },
      data: {
        rows: [
          { id: 1, name: '张三', email: 'zhangsan@example.com' },
          { id: 2, name: '李四', email: 'lisi@example.com' },
          { id: 3, name: '王五', email: 'wangwu@example.com' },
        ],
      },
      children: [
        {
          element: 'div',
          props: { className: 'grid grid-cols-3 bg-muted/50 px-4 py-2 text-sm font-medium text-foreground' },
          children: [
            { element: 'text', children: ['ID'] },
            { element: 'text', children: ['姓名'] },
            { element: 'text', children: ['邮箱'] },
          ],
        },
        {
          element: 'div',
          loop: { items: 'data.rows', itemName: 'row' },
          props: { className: 'grid grid-cols-3 border-t border-border px-4 py-2 text-sm' },
          children: [
            { element: 'text', props: { className: 'text-muted-foreground' }, children: ['${row.id}'] },
            { element: 'text', children: ['${row.name}'] },
            { element: 'text', props: { className: 'text-muted-foreground' }, children: ['${row.email}'] },
          ],
        },
      ],
    },
  },
  {
    id: 'form',
    name: '表单',
    description: '完整表单示例',
    category: 'advanced',
    icon: 'FileText',
    tags: ['form', 'input'],
    schema: {
      element: 'div',
      props: { className: 'space-y-4 rounded-lg border border-border bg-card p-4' },
      data: { name: '', email: '', message: '' },
      children: [
        {
          element: 'text',
          props: { className: 'text-lg font-semibold text-foreground' },
          children: ['联系表单'],
        },
        {
          element: 'div',
          props: { className: 'space-y-2' },
          children: [
            { element: 'text', props: { className: 'text-sm font-medium' }, children: ['姓名'] },
            {
              element: 'input',
              props: {
                type: 'text',
                className: 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary',
                placeholder: '请输入姓名',
                value: '${data.name}',
              },
              events: { change: 'data.name = event.target.value' },
            },
          ],
        },
        {
          element: 'div',
          props: { className: 'space-y-2' },
          children: [
            { element: 'text', props: { className: 'text-sm font-medium' }, children: ['邮箱'] },
            {
              element: 'input',
              props: {
                type: 'email',
                className: 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary',
                placeholder: '请输入邮箱',
                value: '${data.email}',
              },
              events: { change: 'data.email = event.target.value' },
            },
          ],
        },
        {
          element: 'button',
          props: {
            className: 'w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90',
          },
          children: ['提交'],
        },
      ],
    },
  },
  {
    id: 'list',
    name: '列表',
    description: '循环渲染列表',
    category: 'advanced',
    icon: 'List',
    tags: ['list', 'loop'],
    schema: {
      element: 'div',
      props: { className: 'space-y-2' },
      data: {
        items: [
          { id: 1, text: '第一个列表项', completed: false },
          { id: 2, text: '第二个列表项', completed: true },
          { id: 3, text: '第三个列表项', completed: false },
        ],
      },
      children: [
        {
          element: 'div',
          loop: { items: 'data.items', itemName: 'item', indexName: 'idx' },
          props: {
            className: 'flex items-center gap-3 rounded-md border border-border px-3 py-2',
          },
          children: [
            {
              element: 'text',
              props: { className: 'text-xs text-muted-foreground' },
              children: ['${idx + 1}.'],
            },
            {
              element: 'text',
              props: {
                className: '${item.completed ? "line-through text-muted-foreground" : "text-foreground"}',
              },
              children: ['${item.text}'],
            },
            {
              element: 'text',
              condition: 'item.completed',
              props: { className: 'ml-auto text-xs text-emerald-500' },
              children: ['✓'],
            },
          ],
        },
      ],
    },
  },

  // 数据展示
  {
    id: 'stat-card',
    name: '统计卡片',
    description: '数字统计展示',
    category: 'data',
    icon: 'TrendingUp',
    tags: ['stat', 'number', 'data'],
    schema: {
      element: 'div',
      props: { className: 'rounded-lg border border-border bg-card p-4' },
      data: { value: 12580, change: 12.5 },
      children: [
        {
          element: 'text',
          props: { className: 'text-sm text-muted-foreground' },
          children: ['总收入'],
        },
        {
          element: 'div',
          props: { className: 'mt-2 flex items-baseline gap-2' },
          children: [
            {
              element: 'text',
              props: { className: 'text-2xl font-bold text-foreground' },
              children: ['¥${data.value}'],
            },
            {
              element: 'text',
              props: { className: 'text-sm ${data.change >= 0 ? "text-emerald-500" : "text-red-500"}' },
              children: ['${data.change >= 0 ? "+" : ""}${data.change}%'],
            },
          ],
        },
        {
          element: 'text',
          props: { className: 'mt-1 text-xs text-muted-foreground' },
          children: ['相比上月'],
        },
      ],
    },
  },
  {
    id: 'progress-ring',
    name: '进度环',
    description: '圆形进度指示',
    category: 'data',
    icon: 'CircleDot',
    tags: ['progress', 'circle', 'data'],
    schema: {
      element: 'div',
      props: { className: 'flex items-center gap-4' },
      data: { percent: 75 },
      children: [
        {
          element: 'div',
          props: { className: 'relative h-16 w-16' },
          children: [
            {
              element: 'div',
              props: {
                className: 'absolute inset-0 rounded-full border-4 border-muted',
              },
            },
            {
              element: 'div',
              props: {
                className: 'absolute inset-0 rounded-full border-4 border-primary border-r-transparent border-b-transparent',
              },
            },
            {
              element: 'div',
              props: { className: 'absolute inset-0 flex items-center justify-center' },
              children: [
                {
                  element: 'text',
                  props: { className: 'text-sm font-semibold' },
                  children: ['${data.percent}%'],
                },
              ],
            },
          ],
        },
        {
          element: 'div',
          children: [
            {
              element: 'text',
              props: { className: 'font-medium text-foreground' },
              children: ['完成度'],
            },
            {
              element: 'text',
              props: { className: 'text-sm text-muted-foreground' },
              children: ['任务进度'],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'price-card',
    name: '价格卡',
    description: '定价展示组件',
    category: 'data',
    icon: 'CreditCard',
    tags: ['price', 'pricing', 'data'],
    schema: {
      element: 'div',
      props: { className: 'rounded-xl border border-border bg-card p-6 text-center' },
      children: [
        {
          element: 'text',
          props: { className: 'text-lg font-semibold text-foreground' },
          children: ['专业版'],
        },
        {
          element: 'text',
          props: { className: 'mt-1 text-sm text-muted-foreground' },
          children: ['适合中小团队'],
        },
        {
          element: 'div',
          props: { className: 'my-4' },
          children: [
            {
              element: 'text',
              props: { className: 'text-4xl font-bold text-foreground' },
              children: ['¥99'],
            },
            {
              element: 'text',
              props: { className: 'text-muted-foreground' },
              children: ['/月'],
            },
          ],
        },
        {
          element: 'div',
          props: { className: 'space-y-2 text-left text-sm' },
          children: [
            {
              element: 'div',
              props: { className: 'flex items-center gap-2' },
              children: [
                { element: 'text', props: { className: 'text-emerald-500' }, children: ['✓'] },
                { element: 'text', children: ['无限项目'] },
              ],
            },
            {
              element: 'div',
              props: { className: 'flex items-center gap-2' },
              children: [
                { element: 'text', props: { className: 'text-emerald-500' }, children: ['✓'] },
                { element: 'text', children: ['团队协作'] },
              ],
            },
            {
              element: 'div',
              props: { className: 'flex items-center gap-2' },
              children: [
                { element: 'text', props: { className: 'text-emerald-500' }, children: ['✓'] },
                { element: 'text', children: ['优先支持'] },
              ],
            },
          ],
        },
        {
          element: 'button',
          props: { className: 'mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90' },
          children: ['立即订阅'],
        },
      ],
    },
  },
];
