import type { ComponentSchema, ComponentCategory, ComponentSource } from '@/features/components/types';

/** 开发者工具标签页类型 */
export type DevToolsTab = 'docs' | 'editor' | 'templates' | 'debug';

/** 调试日志类型 */
export type DebugLogType = 'expr' | 'event' | 'state' | 'render' | 'error';

/** 调试日志条目 */
export interface DebugLog {
  id: string;
  timestamp: Date;
  type: DebugLogType;
  message: string;
  data?: unknown;
}

/** 日志过滤器类型 */
export type LogFilter = 'all' | DebugLogType;

/** 组件模板分类 */
export type TemplateCategory = 'basic' | 'layout' | 'interactive' | 'advanced' | 'data';

/** 组件模板 */
export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  schema: ComponentSchema;
  tags: string[];
}

/** 导出组件信息 */
export interface ExportComponentInfo {
  name: string;
  description: string;
  type: string;
  category: ComponentCategory;
  source: ComponentSource;
  icon: string;
  version: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** 导出文件格式 */
export interface ExportedComponentFile {
  version: string;
  exportedAt: string;
  component: {
    info: ExportComponentInfo;
    schema: ComponentSchema;
  };
}

/** 开发者工具状态 */
export interface DeveloperToolsState {
  /** 当前活动标签 */
  activeTab: DevToolsTab;
  /** 编辑器中的 Schema 文本 */
  editorContent: string;
  /** 调试日志列表 */
  debugLogs: DebugLog[];
  /** 日志过滤器 */
  logFilter: LogFilter;
  /** 当前选中的模板ID */
  selectedTemplateId: string | null;
}
