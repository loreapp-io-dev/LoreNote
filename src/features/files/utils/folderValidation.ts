import type { FolderReference, PageReference } from '@/types';
import type { FileSettings, FolderLimitBehavior } from '@/types/settings';

/** 验证结果 */
export interface FolderValidationResult {
  /** 是否允许操作 */
  allowed: boolean;
  /** 警告消息（warn 模式下） */
  warning?: string;
  /** 错误消息（block 模式下） */
  error?: string;
}

/**
 * 创建验证结果
 */
function createLimitResult(
  message: string,
  behavior: FolderLimitBehavior
): FolderValidationResult {
  return {
    allowed: behavior === 'warn',
    error: behavior === 'block' ? message : undefined,
    warning: behavior === 'warn' ? message : undefined,
  };
}

/**
 * 计算文件夹在树中的深度
 * @param folderId 文件夹ID，undefined 表示根目录
 * @param folders 所有文件夹列表
 * @returns 深度（根目录为 0，第一层为 1）
 */
export function getFolderDepth(
  folderId: string | undefined,
  folders: FolderReference[]
): number {
  if (!folderId) return 0;

  let depth = 1;
  let currentId: string | undefined = folderId;

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId);
    if (!folder || !folder.parentId) break;
    currentId = folder.parentId;
    depth++;
  }

  return depth;
}

/**
 * 获取文件夹子树的最大深度
 * @param folderId 文件夹ID
 * @param folders 所有文件夹列表
 * @returns 子树最大深度（无子项为 0）
 */
export function getSubtreeMaxDepth(
  folderId: string,
  folders: FolderReference[]
): number {
  const children = folders.filter((f) => f.parentId === folderId);
  if (children.length === 0) return 0;

  return 1 + Math.max(...children.map((c) => getSubtreeMaxDepth(c.id, folders)));
}

/**
 * 统计文件夹内的笔记数量
 * @param folderId 文件夹ID，undefined 表示根目录
 * @param pages 所有页面列表
 */
export function getNotesInFolder(
  folderId: string | undefined,
  pages: PageReference[]
): number {
  return pages.filter((p) => p.parentId === folderId).length;
}

/**
 * 统计文件夹内的子文件夹数量
 * @param folderId 文件夹ID，undefined 表示根目录
 * @param folders 所有文件夹列表
 */
export function getSubfoldersInFolder(
  folderId: string | undefined,
  folders: FolderReference[]
): number {
  return folders.filter((f) => f.parentId === folderId).length;
}

/**
 * 验证创建文件夹
 * @param parentId 父文件夹ID
 * @param folders 所有文件夹列表
 * @param settings 文件设置
 */
export function validateCreateFolder(
  parentId: string | undefined,
  folders: FolderReference[],
  settings: FileSettings
): FolderValidationResult {
  if (!settings.enableFolderLimits) {
    return { allowed: true };
  }

  // 检查深度限制
  const parentDepth = getFolderDepth(parentId, folders);
  const newDepth = parentDepth + 1;

  if (settings.maxFolderDepth > 0 && newDepth > settings.maxFolderDepth) {
    return createLimitResult(
      `depthLimitExceeded:${settings.maxFolderDepth}`,
      settings.folderLimitBehavior
    );
  }

  // 检查子文件夹数量限制
  const currentSubfolders = getSubfoldersInFolder(parentId, folders);
  if (
    settings.maxSubfoldersPerFolder > 0 &&
    currentSubfolders >= settings.maxSubfoldersPerFolder
  ) {
    return createLimitResult(
      `subfoldersLimitExceeded:${settings.maxSubfoldersPerFolder}`,
      settings.folderLimitBehavior
    );
  }

  return { allowed: true };
}

/**
 * 验证创建笔记
 * @param parentId 父文件夹ID
 * @param pages 所有页面列表
 * @param settings 文件设置
 */
export function validateCreateNote(
  parentId: string | undefined,
  pages: PageReference[],
  settings: FileSettings
): FolderValidationResult {
  if (!settings.enableFolderLimits) {
    return { allowed: true };
  }

  // 检查笔记数量限制
  const currentNotes = getNotesInFolder(parentId, pages);
  if (
    settings.maxNotesPerFolder > 0 &&
    currentNotes >= settings.maxNotesPerFolder
  ) {
    return createLimitResult(
      `notesLimitExceeded:${settings.maxNotesPerFolder}`,
      settings.folderLimitBehavior
    );
  }

  return { allowed: true };
}

/**
 * 验证移动文件夹
 * @param folderId 要移动的文件夹ID
 * @param newParentId 新的父文件夹ID
 * @param folders 所有文件夹列表
 * @param settings 文件设置
 */
export function validateMoveFolder(
  folderId: string,
  newParentId: string | undefined,
  folders: FolderReference[],
  settings: FileSettings
): FolderValidationResult {
  if (!settings.enableFolderLimits) {
    return { allowed: true };
  }

  // 检查深度限制（需要考虑子树深度）
  const newParentDepth = getFolderDepth(newParentId, folders);
  const subtreeMaxDepth = getSubtreeMaxDepth(folderId, folders);
  const newTotalDepth = newParentDepth + 1 + subtreeMaxDepth;

  if (settings.maxFolderDepth > 0 && newTotalDepth > settings.maxFolderDepth) {
    return createLimitResult(
      `depthLimitExceeded:${settings.maxFolderDepth}`,
      settings.folderLimitBehavior
    );
  }

  // 检查目标文件夹的子文件夹数量限制
  const folder = folders.find((f) => f.id === folderId);
  // 如果已经在目标文件夹中，不需要检查
  if (folder?.parentId === newParentId) {
    return { allowed: true };
  }

  const currentSubfolders = getSubfoldersInFolder(newParentId, folders);
  if (
    settings.maxSubfoldersPerFolder > 0 &&
    currentSubfolders >= settings.maxSubfoldersPerFolder
  ) {
    return createLimitResult(
      `subfoldersLimitExceeded:${settings.maxSubfoldersPerFolder}`,
      settings.folderLimitBehavior
    );
  }

  return { allowed: true };
}

/**
 * 验证移动笔记
 * @param pageId 要移动的笔记ID
 * @param newParentId 新的父文件夹ID
 * @param pages 所有页面列表
 * @param settings 文件设置
 */
export function validateMoveNote(
  pageId: string,
  newParentId: string | undefined,
  pages: PageReference[],
  settings: FileSettings
): FolderValidationResult {
  if (!settings.enableFolderLimits) {
    return { allowed: true };
  }

  // 如果已经在目标文件夹中，不需要检查
  const page = pages.find((p) => p.id === pageId);
  if (page?.parentId === newParentId) {
    return { allowed: true };
  }

  // 检查目标文件夹的笔记数量限制
  const currentNotes = getNotesInFolder(newParentId, pages);
  if (
    settings.maxNotesPerFolder > 0 &&
    currentNotes >= settings.maxNotesPerFolder
  ) {
    return createLimitResult(
      `notesLimitExceeded:${settings.maxNotesPerFolder}`,
      settings.folderLimitBehavior
    );
  }

  return { allowed: true };
}

/**
 * 解析验证消息，替换占位符
 * @param message 消息模板（如 "depthLimitExceeded:7"）
 * @param translations 翻译对象的 files 部分
 */
export function parseValidationMessage(
  message: string,
  filesTranslations: Record<string, string>
): string {
  const [key, value] = message.split(':');
  const template = filesTranslations[key] || message;
  return template.replace('{max}', value || '');
}
