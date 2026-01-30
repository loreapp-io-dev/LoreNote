import { create } from 'zustand';
import { generateId } from '@/utils/uuid';
import type { DevToolsTab, DebugLogType, LogFilter, DeveloperToolsState } from './types';

/** 日志缓冲区 - 用于批量处理日志，避免频繁触发状态更新 */
let logBuffer: Array<{type: DebugLogType, message: string, data?: unknown}> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** 默认 Schema 内容 */
const DEFAULT_SCHEMA = `{
  "element": "div",
  "props": {
    "className": "p-4 rounded-lg border border-border bg-card"
  },
  "children": [
    {
      "element": "text",
      "props": {
        "className": "text-lg font-medium text-foreground"
      },
      "children": ["Hello, World!"]
    }
  ]
}`;

interface DeveloperToolsActions {
  /** 设置当前活动标签 */
  setActiveTab: (tab: DevToolsTab) => void;
  /** 设置编辑器内容 */
  setEditorContent: (content: string) => void;
  /** 添加调试日志 */
  addDebugLog: (type: DebugLogType, message: string, data?: unknown) => void;
  /** 清空调试日志 */
  clearDebugLogs: () => void;
  /** 设置日志过滤器 */
  setLogFilter: (filter: LogFilter) => void;
  /** 设置选中的模板ID */
  setSelectedTemplateId: (id: string | null) => void;
  /** 从模板加载内容 */
  loadFromTemplate: (schemaJson: string) => void;
}

export const useDeveloperToolsStore = create<DeveloperToolsState & DeveloperToolsActions>()(
  (set) => ({
    // 初始状态
    activeTab: 'docs',
    editorContent: DEFAULT_SCHEMA,
    debugLogs: [],
    logFilter: 'all',
    selectedTemplateId: null,

    // Actions
    setActiveTab: (activeTab) => set({ activeTab }),

    setEditorContent: (editorContent) => set({ editorContent }),

    addDebugLog: (type, message, data) => {
      // 将日志添加到缓冲区而不是立即更新状态
      logBuffer.push({ type, message, data });

      // 清除之前的定时器
      if (flushTimer) clearTimeout(flushTimer);

      // 设置新的定时器，100ms 后批量刷新日志
      flushTimer = setTimeout(() => {
        if (logBuffer.length === 0) return;

        const logsToAdd = logBuffer.map(log => ({
          id: generateId(),
          timestamp: new Date(),
          type: log.type,
          message: log.message,
          data: log.data,
        }));

        // 清空缓冲区
        logBuffer = [];

        // 批量更新状态
        set((state) => ({
          debugLogs: [...state.debugLogs, ...logsToAdd].slice(-500),
        }));
      }, 100);
    },

    clearDebugLogs: () => set({ debugLogs: [] }),

    setLogFilter: (logFilter) => set({ logFilter }),

    setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),

    loadFromTemplate: (schemaJson) =>
      set({
        editorContent: schemaJson,
        activeTab: 'editor',
      }),
  })
);

// 导出全局调试日志函数，方便其他模块调用
export function logDebug(type: DebugLogType, message: string, data?: unknown): void {
  useDeveloperToolsStore.getState().addDebugLog(type, message, data);
}
