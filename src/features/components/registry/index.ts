/**
 * ComponentRegistry - 统一组件注册表
 * 作为斜杠菜单和组件库的唯一数据源
 */

import type { SchemaComponent } from '@/engine-v8/types';
import type {
  RegisteredComponent,
  ComponentSource,
  ComponentCategory,
  SearchOptions,
  RegisterOptions,
} from './types';
import { officialComponents } from './official-components';
import { generateId } from '@/utils/uuid';

/**
 * 组件注册表类
 * 管理所有组件的注册、查询和实例化
 */
class ComponentRegistry {
  private components: Map<string, RegisteredComponent> = new Map();

  constructor() {
    // 初始化时注册所有官方组件
    this.registerOfficialComponents();
  }

  /** 注册官方组件 */
  private registerOfficialComponents(): void {
    for (const component of officialComponents) {
      this.components.set(component.id, component);
    }
    console.log(`[ComponentRegistry] Registered ${officialComponents.length} official components`);
  }

  // ==================== 注册 ====================

  /**
   * 注册组件
   * @param component 组件定义
   * @param options 注册选项
   */
  register(component: RegisteredComponent, options?: RegisterOptions): void {
    if (this.components.has(component.id) && !options?.override) {
      console.warn(`[ComponentRegistry] Component ${component.id} already exists, skipping`);
      return;
    }
    this.components.set(component.id, component);
    console.log(`[ComponentRegistry] Registered component: ${component.id}`);
  }

  /**
   * 批量注册组件
   * @param components 组件列表
   * @param options 注册选项
   */
  registerBatch(components: RegisteredComponent[], options?: RegisterOptions): void {
    for (const component of components) {
      this.register(component, options);
    }
  }

  /**
   * 注销组件
   * @param id 组件 ID
   */
  unregister(id: string): boolean {
    const deleted = this.components.delete(id);
    if (deleted) {
      console.log(`[ComponentRegistry] Unregistered component: ${id}`);
    }
    return deleted;
  }

  // ==================== 查询 ====================

  /**
   * 根据 ID 获取组件
   */
  getById(id: string): RegisteredComponent | undefined {
    return this.components.get(id);
  }

  /**
   * 根据类型获取组件
   */
  getByType(type: string): RegisteredComponent | undefined {
    for (const component of this.components.values()) {
      if (component.type === type) {
        return component;
      }
    }
    return undefined;
  }

  /**
   * 获取所有组件
   */
  getAll(): RegisteredComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * 按来源获取组件
   */
  getBySource(source: ComponentSource): RegisteredComponent[] {
    return this.getAll().filter((c) => c.source === source);
  }

  /**
   * 按分类获取组件
   */
  getByCategory(category: ComponentCategory): RegisteredComponent[] {
    return this.getAll().filter((c) => c.category === category);
  }

  /**
   * 获取已安装的组件
   */
  getInstalled(): RegisteredComponent[] {
    return this.getAll().filter((c) => c.installed);
  }

  /**
   * 获取已启用的组件
   */
  getEnabled(): RegisteredComponent[] {
    return this.getAll().filter((c) => c.enabled);
  }

  /**
   * 获取可用于斜杠菜单的组件（已安装且已启用）
   */
  getAvailableForSlashMenu(): RegisteredComponent[] {
    return this.getAll().filter((c) => c.installed && c.enabled);
  }

  // ==================== 搜索 ====================

  /**
   * 搜索组件
   * @param query 搜索关键词
   * @param options 搜索选项
   */
  search(query: string, options?: SearchOptions): RegisteredComponent[] {
    let results = this.getAll();

    // 按来源筛选
    if (options?.source) {
      results = results.filter((c) => c.source === options.source);
    }

    // 按分类筛选
    if (options?.category) {
      results = results.filter((c) => c.category === options.category);
    }

    // 只返回已安装的
    if (options?.installedOnly) {
      results = results.filter((c) => c.installed);
    }

    // 只返回已启用的
    if (options?.enabledOnly) {
      results = results.filter((c) => c.enabled);
    }

    // 关键词搜索
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return results;
  }

  // ==================== 实例化 ====================

  /**
   * 创建组件实例
   * 基于组件的 schema 模板创建新的实例（带有新 ID）
   * @param id 组件 ID
   */
  createInstance(id: string): SchemaComponent | null {
    const component = this.getById(id);
    if (!component) {
      console.warn(`[ComponentRegistry] Component ${id} not found`);
      return null;
    }

    // 深拷贝 schema 并生成新 ID
    const instance = JSON.parse(JSON.stringify(component.schema)) as SchemaComponent;
    instance.id = generateId();

    console.log(`[ComponentRegistry] Created instance of ${id} with new id: ${instance.id}`);
    return instance;
  }

  /**
   * 根据类型创建组件实例
   * @param type 组件类型
   */
  createInstanceByType(type: string): SchemaComponent | null {
    const component = this.getByType(type);
    if (!component) {
      console.warn(`[ComponentRegistry] Component type ${type} not found`);
      return null;
    }
    return this.createInstance(component.id);
  }

  // ==================== 状态管理 ====================

  /**
   * 更新组件状态
   * @param id 组件 ID
   * @param updates 更新内容
   */
  updateComponent(
    id: string,
    updates: Partial<Pick<RegisteredComponent, 'installed' | 'enabled'>>
  ): boolean {
    const component = this.components.get(id);
    if (!component) {
      return false;
    }

    const updatedComponent = { ...component, ...updates, updatedAt: new Date().toISOString() };
    this.components.set(id, updatedComponent);
    return true;
  }

  /**
   * 启用组件
   */
  enable(id: string): boolean {
    return this.updateComponent(id, { enabled: true });
  }

  /**
   * 禁用组件
   */
  disable(id: string): boolean {
    return this.updateComponent(id, { enabled: false });
  }

  /**
   * 标记组件为已安装
   */
  markInstalled(id: string): boolean {
    return this.updateComponent(id, { installed: true });
  }

  /**
   * 标记组件为未安装
   */
  markUninstalled(id: string): boolean {
    return this.updateComponent(id, { installed: false });
  }

  // ==================== 统计 ====================

  /**
   * 获取组件统计
   */
  getStats(): {
    total: number;
    official: number;
    community: number;
    local: number;
    installed: number;
    enabled: number;
  } {
    const all = this.getAll();
    return {
      total: all.length,
      official: all.filter((c) => c.source === 'official').length,
      community: all.filter((c) => c.source === 'community').length,
      local: all.filter((c) => c.source === 'local').length,
      installed: all.filter((c) => c.installed).length,
      enabled: all.filter((c) => c.enabled).length,
    };
  }
}

/** 全局组件注册表单例 */
export const componentRegistry = new ComponentRegistry();

export { ComponentRegistry };
