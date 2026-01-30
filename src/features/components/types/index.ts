/**
 * 组件库类型定义
 */

/** 组件来源 */
export type ComponentSource = 'official' | 'community' | 'local';

/** 组件分类 */
export type ComponentCategory = 'basic' | 'media' | 'advanced' | 'embed' | 'layout' | 'interactive' | 'database' | 'inline';

/** 组件信息 */
export interface ComponentInfo {
  /** 唯一标识 */
  id: string;
  /** 组件类型名 (用于 schema-templates) */
  type: string;
  /** 显示名称 (i18n key 或直接文本) */
  name: string;
  /** 描述 (i18n key 或直接文本) */
  description: string;
  /** 图标 (lucide-react 图标名) */
  icon: string;
  /** 分类 */
  category: ComponentCategory;
  /** 来源 */
  source: ComponentSource;
  /** 版本 */
  version: string;
  /** 作者 */
  author: string;
  /** 下载量 (社区组件) */
  downloads?: number;
  /** 评分 (社区组件, 0-5) */
  rating?: number;
  /** 是否已安装 */
  installed: boolean;
  /** 预览图 URL */
  previewUrl?: string;
  /** 标签 */
  tags?: string[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** JSON Schema 定义 (本地组件) */
  schema?: ComponentSchema;
}

/** 组件 JSON Schema 定义 */
export interface ComponentSchema {
  /** 组件渲染模板 */
  element: string;
  /** 组件 ID（用于状态管理） */
  id?: string;
  /** 组件属性 */
  props?: Record<string, unknown>;
  /** 组件样式 */
  style?: Record<string, unknown>;
  /** 子元素 */
  children?: (ComponentSchema | string)[];
  /** 组件数据 */
  data?: Record<string, unknown>;
  /** 事件处理 */
  events?: Record<string, string>;
  /** 条件渲染表达式 */
  condition?: string;
  /** 循环渲染配置 */
  loop?: {
    items: string;
    itemName?: string;
    indexName?: string;
  };
}

/** 本地组件文件结构 */
export interface LocalComponentFile {
  /** 组件元信息 */
  info: Omit<ComponentInfo, 'id' | 'installed'>;
  /** 组件 Schema */
  schema: ComponentSchema;
}

/** 分类定义 */
export interface CategoryDef {
  id: ComponentCategory;
  name: string;
  icon: string;
}

/** 组件分类列表 */
export const componentCategories: CategoryDef[] = [
  { id: 'basic', name: 'componentLibrary.categories.basic', icon: 'Type' },
  { id: 'media', name: 'componentLibrary.categories.media', icon: 'Image' },
  { id: 'layout', name: 'componentLibrary.categories.layout', icon: 'Layout' },
  { id: 'advanced', name: 'componentLibrary.categories.advanced', icon: 'LayoutGrid' },
  { id: 'database', name: 'componentLibrary.categories.database', icon: 'Database' },
  { id: 'inline', name: 'componentLibrary.categories.inline', icon: 'AtSign' },
  { id: 'embed', name: 'componentLibrary.categories.embed', icon: 'Globe' },
  { id: 'interactive', name: 'componentLibrary.categories.interactive', icon: 'MousePointer' },
];
