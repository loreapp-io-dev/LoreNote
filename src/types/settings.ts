import type { Locale } from '@/i18n';

/** 主题类型 */
export type Theme = 'light' | 'dark' | 'system';

/** 外观设置 */
export interface AppearanceSettings {
  /** 主题 */
  theme: Theme;
  /** 语言 */
  locale: Locale;
  /** 侧边栏宽度 */
  sidebarWidth: number;
  /** 编辑器字体大小 */
  editorFontSize: number;
  /** 编辑器行高 */
  editorLineHeight: number;
}

/** 编辑器设置 */
export interface EditorSettings {
  /** 自动保存延迟（毫秒） */
  autoSaveDelay: number;
  /** 显示行号 */
  showLineNumbers: boolean;
  /** 自动换行 */
  wordWrap: boolean;
  /** 拼写检查 */
  spellCheck: boolean;
}

/** 文件夹限制行为 */
export type FolderLimitBehavior = 'warn' | 'block';

/** 文件设置 */
export interface FileSettings {
  /** 默认文件位置 */
  defaultLocation: string;
  /** 自动备份 */
  autoBackup: boolean;
  /** 备份间隔（分钟） */
  backupInterval: number;
  /** 启用文件夹限制 */
  enableFolderLimits: boolean;
  /** 最大嵌套层级 */
  maxFolderDepth: number;
  /** 单个文件夹最大笔记数（0 = 无限制） */
  maxNotesPerFolder: number;
  /** 单个文件夹最大子文件夹数（0 = 无限制） */
  maxSubfoldersPerFolder: number;
  /** 超出限制时的行为 */
  folderLimitBehavior: FolderLimitBehavior;
}

/** 高级设置 */
export interface AdvancedSettings {
  /** 开发者模式 */
  developerMode: boolean;
  /** 硬件加速 */
  hardwareAcceleration: boolean;
  /** 调试日志 */
  debugLogging: boolean;
}

/** 本地状态（不在设置界面显示，仅存储用户状态） */
export interface LocalState {
  /** 已阅读的入门指南项目 */
  gettingStartedRead: string[];
}

/** 所有设置 */
export interface AppSettings {
  appearance: AppearanceSettings;
  editor: EditorSettings;
  files: FileSettings;
  advanced: AdvancedSettings;
  local: LocalState;
}

/** 设置分类 */
export type SettingsCategory = 'appearance' | 'editor' | 'files' | 'advanced';

/** 默认设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'system',
    locale: 'zh',
    sidebarWidth: 260,
    editorFontSize: 16,
    editorLineHeight: 1.6,
  },
  editor: {
    autoSaveDelay: 5000,
    showLineNumbers: false,
    wordWrap: true,
    spellCheck: false,
  },
  files: {
    defaultLocation: '',
    autoBackup: false,
    backupInterval: 30,
    enableFolderLimits: false,
    maxFolderDepth: 7,
    maxNotesPerFolder: 50,
    maxSubfoldersPerFolder: 20,
    folderLimitBehavior: 'block',
  },
  advanced: {
    developerMode: false,
    hardwareAcceleration: true,
    debugLogging: false,
  },
  local: {
    gettingStartedRead: [],
  },
};
