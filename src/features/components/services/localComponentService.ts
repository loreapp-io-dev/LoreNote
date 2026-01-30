/**
 * 本地组件管理服务
 * 组件存储在应用数据目录下的 components/ 文件夹中
 * 每个组件是一个 JSON 文件，包含元信息和 schema
 */

import { getAppDataPath, joinPath, ensureDir, listDirWithInfo, readJsonFile, writeJsonFile, removePath } from '@/services/fs';
import { generateId } from '@/utils';
import type { ComponentInfo, LocalComponentFile, ComponentSchema, ComponentCategory } from '../types';

/** 组件目录名 */
const COMPONENTS_DIR = 'components';

/** 获取组件目录路径 */
async function getComponentsDir(): Promise<string> {
  const appDataPath = await getAppDataPath();
  return joinPath(appDataPath, COMPONENTS_DIR);
}

/** 确保组件目录存在 */
async function ensureComponentsDir(): Promise<string> {
  const dir = await getComponentsDir();
  await ensureDir(dir);
  return dir;
}

/** 从文件名提取组件ID */
function getComponentIdFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/, '');
}

/** 获取组件文件路径 */
async function getComponentFilePath(componentId: string): Promise<string> {
  const dir = await getComponentsDir();
  return joinPath(dir, `${componentId}.json`);
}

/** 加载所有本地组件 */
export async function loadLocalComponents(): Promise<ComponentInfo[]> {
  try {
    const dir = await ensureComponentsDir();
    const entries = await listDirWithInfo(dir);

    const components: ComponentInfo[] = [];

    for (const entry of entries) {
      if (!entry.name || !entry.name.endsWith('.json') || entry.isDirectory) {
        continue;
      }

      const componentId = getComponentIdFromFileName(entry.name);
      const filePath = await joinPath(dir, entry.name);
      const fileData = await readJsonFile<LocalComponentFile>(filePath);

      if (fileData && fileData.info) {
        components.push({
          ...fileData.info,
          id: componentId,
          installed: true,
          schema: fileData.schema,
        });
      }
    }

    return components;
  } catch (error) {
    console.error('Failed to load local components:', error);
    return [];
  }
}

/** 创建新的本地组件 */
export async function createLocalComponent(
  name: string,
  description: string,
  category: ComponentCategory,
  schema: ComponentSchema,
  options?: {
    icon?: string;
    tags?: string[];
    author?: string;
  }
): Promise<ComponentInfo | null> {
  try {
    const componentId = `local-${generateId()}`;
    const now = new Date().toISOString().split('T')[0];

    const info: Omit<ComponentInfo, 'id' | 'installed'> = {
      type: componentId,
      name,
      description,
      icon: options?.icon || 'Box',
      category,
      source: 'local',
      version: '1.0.0',
      author: options?.author || 'Local',
      tags: options?.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const fileData: LocalComponentFile = {
      info,
      schema,
    };

    const filePath = await getComponentFilePath(componentId);
    const success = await writeJsonFile(filePath, fileData);

    if (success) {
      return {
        ...info,
        id: componentId,
        installed: true,
        schema,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to create local component:', error);
    return null;
  }
}

/** 更新本地组件 */
export async function updateLocalComponent(
  componentId: string,
  updates: {
    name?: string;
    description?: string;
    category?: ComponentCategory;
    icon?: string;
    tags?: string[];
    schema?: ComponentSchema;
    version?: string;
  }
): Promise<ComponentInfo | null> {
  try {
    const filePath = await getComponentFilePath(componentId);
    const fileData = await readJsonFile<LocalComponentFile>(filePath);

    if (!fileData) {
      console.error('Component not found:', componentId);
      return null;
    }

    const now = new Date().toISOString().split('T')[0];

    const updatedInfo: Omit<ComponentInfo, 'id' | 'installed'> = {
      ...fileData.info,
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.category && { category: updates.category }),
      ...(updates.icon && { icon: updates.icon }),
      ...(updates.tags && { tags: updates.tags }),
      ...(updates.version && { version: updates.version }),
      updatedAt: now,
    };

    const updatedSchema = updates.schema || fileData.schema;

    const updatedFileData: LocalComponentFile = {
      info: updatedInfo,
      schema: updatedSchema,
    };

    const success = await writeJsonFile(filePath, updatedFileData);

    if (success) {
      return {
        ...updatedInfo,
        id: componentId,
        installed: true,
        schema: updatedSchema,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to update local component:', error);
    return null;
  }
}

/** 删除本地组件 */
export async function deleteLocalComponent(componentId: string): Promise<boolean> {
  try {
    const filePath = await getComponentFilePath(componentId);
    return await removePath(filePath);
  } catch (error) {
    console.error('Failed to delete local component:', error);
    return false;
  }
}

/** 获取单个本地组件 */
export async function getLocalComponent(componentId: string): Promise<ComponentInfo | null> {
  try {
    const filePath = await getComponentFilePath(componentId);
    const fileData = await readJsonFile<LocalComponentFile>(filePath);

    if (!fileData) {
      return null;
    }

    return {
      ...fileData.info,
      id: componentId,
      installed: true,
      schema: fileData.schema,
    };
  } catch (error) {
    console.error('Failed to get local component:', error);
    return null;
  }
}

/** 创建默认的组件 Schema 模板 */
export function createDefaultSchema(): ComponentSchema {
  return {
    element: 'div',
    props: {
      className: 'p-4 rounded-lg border border-border bg-card',
    },
    children: [
      {
        element: 'span',
        props: {
          className: 'text-sm text-foreground',
        },
        children: ['Hello, World!'],
      },
    ],
  };
}
