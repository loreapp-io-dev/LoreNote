/**
 * 仓库 - 对应一个本地文件夹（类似 Obsidian Vault）
 */
export interface Vault {
  /** 仓库唯一标识 */
  id: string;
  /** 仓库名称 */
  name: string;
  /** 仓库路径 (本地文件夹绝对路径) */
  path: string;
  /** 描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 默认打开的页面ID */
  defaultPageId?: string;
  /** 仓库配置 */
  settings?: VaultSettings;
}

/** 仓库配置 */
export interface VaultSettings {
  /** 主题 */
  theme?: 'light' | 'dark' | 'system';
  /** 是否显示文件扩展名 */
  showExtensions?: boolean;
  /** 排序方式 */
  sortOrder?: 'name' | 'created' | 'updated';
}

/** 仓库元数据文件结构 (存储在 .lorenote/vault.json) */
export interface VaultMetadata {
  /** 版本号 */
  version: string;
  /** 仓库信息 (不含路径) */
  vault: Omit<Vault, 'path'>;
  /** 页面列表 */
  pages: PageReference[];
  /** 文件夹列表 */
  folders?: FolderReference[];
  /** 回收站项目列表 */
  trash?: TrashItem[];
}

/** 回收站项目类型 */
export type TrashItemType = 'page' | 'folder';

/** 回收站项目 */
export interface TrashItem {
  /** 唯一标识 */
  id: string;
  /** 项目类型 */
  type: TrashItemType;
  /** 原始数据 (页面或文件夹引用) */
  originalData: PageReference | FolderReference;
  /** 原始父级ID (用于恢复时还原位置) */
  originalParentId?: string;
  /** 删除时间 */
  deletedAt: string;
}

/** 文件系统项目类型 */
export type FileSystemItemType = 'folder' | 'page';

/** 图标类型 */
export type IconType = 'lucide' | 'emoji';

/** 文件夹引用 */
export interface FolderReference {
  /** 文件夹ID */
  id: string;
  /** 文件夹名称 */
  name: string;
  /** 父级文件夹ID */
  parentId?: string;
  /** 排序索引 (用于手动排序) */
  sortIndex?: number;
  /** 图标 (Lucide 图标名或 Emoji) */
  icon?: string;
  /** 图标类型 */
  iconType?: IconType;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 页面引用 (存储在仓库元数据中) */
export interface PageReference {
  /** 页面ID */
  id: string;
  /** 页面标题 */
  title: string;
  /** 相对于仓库的文件名 (如 page-xxx.json) */
  filename: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 父级文件夹ID (用于层级结构) */
  parentId?: string;
  /** 排序索引 (用于手动排序) */
  sortIndex?: number;
  /** 图标 */
  icon?: string;
  /** 图标类型 */
  iconType?: IconType;
}

/** 仓库注册表 - 存储在应用数据目录 */
export interface VaultRegistry {
  /** 版本号 */
  version: string;
  /** 已知仓库列表 */
  vaults: VaultRegistryEntry[];
  /** 上次打开的仓库ID */
  lastOpenedVaultId?: string;
}

/** 仓库注册表条目 */
export interface VaultRegistryEntry {
  /** 仓库ID */
  id: string;
  /** 仓库名称 (缓存) */
  name: string;
  /** 仓库路径 */
  path: string;
  /** 添加时间 */
  addedAt: string;
  /** 上次打开时间 */
  lastOpenedAt?: string;
}
