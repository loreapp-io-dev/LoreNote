import type { CSSProperties } from 'react';

/**
 * 组件基础接口 - LoreNote核心数据结构
 * 遵循 "组件即页面，页面即组件" 的设计理念
 *
 * 注意：此类型与 SchemaComponent (V8 引擎) 兼容
 */
export interface Component {
  /** HTML 元素或内置别名 */
  element: string;
  /** 组件唯一标识 (UUID v4) */
  id?: string;
  /** 组件配置属性 */
  props?: Record<string, unknown>;
  /** 组件动态数据 */
  data?: Record<string, unknown>;
  /** 组件样式 (Tailwind类名或内联样式) */
  style?: ComponentStyle;
  /** 子组件列表 */
  children?: (Component | string)[];
  /** 事件处理表达式 */
  events?: Record<string, string>;
  /** 条件渲染表达式 */
  condition?: string;
  /** 循环渲染 */
  loop?: {
    items: string;
    itemName?: string;
    indexName?: string;
  };
  /** 元信息 */
  meta?: ComponentMeta;
}

/** 组件类型 (已弃用，保留兼容) */
export type ComponentType =
  | 'page'
  | 'container'
  | 'text'
  | 'heading'
  | 'list'
  | 'image'
  | 'code'
  | 'divider'
  | 'callout'
  | 'quote'
  | 'toggle'
  | 'table'
  | 'synced-block'
  | string;

/** 组件样式定义 */
export interface ComponentStyle {
  /** Tailwind CSS 类名 */
  className?: string;
  /** 内联样式 */
  inline?: CSSProperties;
  /** 条件样式 (基于表达式) */
  conditional?: ConditionalStyle[];
}

/** 条件样式 */
export interface ConditionalStyle {
  /** 条件表达式 */
  condition: string;
  /** 满足条件时应用的类名 */
  className: string;
}

/** 组件元信息 */
export interface ComponentMeta {
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 创建者 */
  createdBy?: string;
  /** 来源组件ID (同步块的源) */
  sourceId?: string;
  /** 是否为同步块 */
  isSynced?: boolean;
}
