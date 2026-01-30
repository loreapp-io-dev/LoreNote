/**
 * 双向链接类型定义
 * 支持 Obsidian 风格的页面间链接和反向链接
 */

/**
 * 链接块数据 - 页面/块级链接
 * 对应组件类型: 'link'
 */
export interface LinkBlockData {
  /** 目标页面ID */
  targetPageId: string;
  /** 目标块ID（可选，精确到块级链接） */
  targetBlockId?: string;
  /** 自定义显示文本，默认使用目标页面标题 */
  displayText?: string;
  /** 是否显示预览卡片 */
  showPreview?: boolean;
  /** 预览内容长度（字数） */
  previewLength?: number;
  /** 自定义图标 */
  icon?: string;
  /** 图标类型 */
  iconType?: 'lucide' | 'emoji';
  /** 链接样式变体 */
  variant?: LinkVariant;
  /** 链接是否已失效（目标被删除） */
  isBroken?: boolean;
  /** 最后验证时间 */
  lastVerifiedAt?: string;
}

/** 链接样式变体 */
export type LinkVariant = 'inline' | 'card' | 'mention';

/**
 * 反向链接块数据 - 显示指向当前页面的所有链接
 * 对应组件类型: 'backlink'
 */
export interface BacklinkBlockData {
  /** 显示数量限制 */
  limit?: number;
  /** 排序方式 */
  sortBy?: 'recent' | 'alphabetical';
  /** 是否显示链接计数 */
  showCount?: boolean;
  /** 是否按源页面分组 */
  groupByPage?: boolean;
  /** 布局方式 */
  layout?: 'list' | 'grid' | 'compact';
}

/**
 * 链接元数据 - 存储在页面文件中
 */
export interface LinkMetadata {
  /** 链接唯一ID */
  id: string;
  /** 目标页面ID */
  targetPageId: string;
  /** 目标块ID（可选） */
  targetBlockId?: string;
  /** 包含此链接的块ID */
  sourceBlockId: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 反向链接记录 - 存储在仓库索引中
 */
export interface BacklinkRecord {
  /** 源页面ID */
  sourcePageId: string;
  /** 源页面标题（缓存用于显示） */
  sourcePageTitle?: string;
  /** 源块ID */
  sourceBlockId?: string;
  /** 源块内容预览 */
  sourceBlockPreview?: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 仓库链接索引 - 用于快速查询反向链接
 * 存储在 .lorenote/vault.json 的 linkIndex 字段中
 */
export interface LinkIndex {
  /** 目标页面ID -> 反向链接列表 */
  [targetPageId: string]: BacklinkRecord[];
}

/**
 * 失效链接记录
 */
export interface BrokenLinkRecord {
  /** 源页面ID */
  sourcePageId: string;
  /** 源块ID */
  sourceBlockId?: string;
  /** 原目标页面ID */
  targetPageId: string;
  /** 检测到失效的时间 */
  detectedAt: string;
}

/**
 * 链接验证结果
 */
export interface LinkValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 目标页面是否存在 */
  pageExists: boolean;
  /** 目标块是否存在（如果指定了块ID） */
  blockExists?: boolean;
  /** 目标页面标题（如果存在） */
  pageTitle?: string;
  /** 错误信息（如果无效） */
  error?: string;
}

/**
 * 行内链接格式 - 用于 TextFormat
 * 存储在文本块的 formats 数组中
 */
export interface InlineLinkFormat {
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
  /** 格式类型 */
  type: 'link';
  /** 链接值：内部链接格式为 "page:pageId" 或 "page:pageId#blockId" */
  value: string;
}

/**
 * 解析内部链接值
 */
export function parseInternalLink(value: string): {
  isInternal: boolean;
  pageId?: string;
  blockId?: string;
} {
  if (!value.startsWith('page:')) {
    return { isInternal: false };
  }

  const linkPart = value.slice(5); // 移除 'page:' 前缀
  const [pageId, blockId] = linkPart.split('#');

  return {
    isInternal: true,
    pageId,
    blockId,
  };
}

/**
 * 创建内部链接值
 */
export function createInternalLinkValue(pageId: string, blockId?: string): string {
  return blockId ? `page:${pageId}#${blockId}` : `page:${pageId}`;
}

/**
 * 检查是否为内部链接
 */
export function isInternalLink(value: string): boolean {
  return value.startsWith('page:');
}
