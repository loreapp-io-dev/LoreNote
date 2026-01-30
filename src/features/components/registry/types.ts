/**
 * ComponentRegistry 类型定义
 * 统一组件注册表的核心类型
 */

import type { SchemaComponent } from '@/engine-v8/types';

/** 组件来源 */
export type ComponentSource = 'official' | 'community' | 'local';

/** 组件分类 */
export type ComponentCategory =
  | 'basic' // 基础：文本、标题、列表、引用、表格、分隔线
  | 'media' // 媒体：图片、视频、音频、文件、代码
  | 'layout' // 布局：分栏、网格
  | 'advanced' // 高级：目录、公式、按钮
  | 'database' // 数据库：表格视图、看板、日历
  | 'embed'; // 嵌入：网页、PDF、第三方服务

/** 分类定义 */
export interface CategoryDefinition {
  id: ComponentCategory;
  name: string; // i18n key
  icon: string; // Lucide icon name
}

/** 所有分类 */
export const componentCategories: CategoryDefinition[] = [
  { id: 'basic', name: 'componentLibrary.categories.basic', icon: 'Type' },
  { id: 'media', name: 'componentLibrary.categories.media', icon: 'Image' },
  { id: 'layout', name: 'componentLibrary.categories.layout', icon: 'Layout' },
  { id: 'advanced', name: 'componentLibrary.categories.advanced', icon: 'Puzzle' },
  { id: 'embed', name: 'componentLibrary.categories.embed', icon: 'Globe' },
];

/**
 * 注册的组件 - 统一数据结构
 * 同时服务于斜杠菜单和组件库
 */
export interface RegisteredComponent {
  // ========== 基础信息 ==========
  /** 唯一标识 (如 "official-text", "community-chart", "local-xxx") */
  id: string;
  /** 组件类型 (如 "text", "heading", "chart") */
  type: string;
  /** 显示名称 (i18n key 或直接文本) */
  name: string;
  /** 描述 (i18n key 或直接文本) */
  description: string;
  /** 图标名称 (lucide-react) */
  icon: string;

  // ========== 分类 ==========
  /** 所属分类 */
  category: ComponentCategory;
  /** 来源 */
  source: ComponentSource;

  // ========== 版本和作者 ==========
  /** 版本号 */
  version: string;
  /** 作者 */
  author: string;

  // ========== 社区组件特有 ==========
  /** 下载量 */
  downloads?: number;
  /** 评分 (0-5) */
  rating?: number;
  /** 组件仓库地址 */
  repositoryUrl?: string;

  // ========== 状态 ==========
  /** 是否已安装（官方默认 true） */
  installed: boolean;
  /** 是否启用（可禁用某些组件） */
  enabled: boolean;

  // ========== 搜索 ==========
  /** 搜索关键词 */
  keywords: string[];
  /** 标签 */
  tags?: string[];

  // ========== 组件定义 ==========
  /** JSON Schema 定义 - 静态模板 */
  schema: SchemaComponent;

  // ========== 时间戳 ==========
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 创建组件实例的工厂函数类型 */
export type ComponentFactory = () => SchemaComponent;

/** 组件注册选项 */
export interface RegisterOptions {
  /** 是否覆盖已存在的组件 */
  override?: boolean;
}

/** 搜索选项 */
export interface SearchOptions {
  /** 按来源筛选 */
  source?: ComponentSource;
  /** 按分类筛选 */
  category?: ComponentCategory;
  /** 只返回已安装的 */
  installedOnly?: boolean;
  /** 只返回已启用的 */
  enabledOnly?: boolean;
}

/** 组件导出格式 */
export interface ExportedComponent {
  /** 元信息 */
  meta: {
    name: string;
    description: string;
    icon: string;
    category: ComponentCategory;
    version: string;
    author: string;
    keywords: string[];
    tags?: string[];
  };
  /** Schema 定义 */
  schema: SchemaComponent;
}
