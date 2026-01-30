/**
 * 组件注册表状态管理
 * 使用 Zustand 管理 ComponentRegistry 的响应式状态
 */

import { create } from 'zustand';
import type { SchemaComponent } from '@/engine-v8/types';
import type {
  RegisteredComponent,
  ComponentSource,
  ComponentCategory,
  SearchOptions,
} from '../registry/types';
import { componentRegistry } from '../registry';

interface RegistryState {
  /** 当前选中的来源 Tab */
  activeSource: ComponentSource;

  /** 搜索关键词 */
  searchQuery: string;

  /** 当前分类筛选 */
  categoryFilter: ComponentCategory | null;

  /** 组件版本号（用于触发重新渲染） */
  version: number;

  // ========== Actions ==========

  /** 设置当前来源 Tab */
  setActiveSource: (source: ComponentSource) => void;

  /** 设置搜索关键词 */
  setSearchQuery: (query: string) => void;

  /** 设置分类筛选 */
  setCategoryFilter: (category: ComponentCategory | null) => void;

  /** 刷新组件列表（触发重新渲染） */
  refresh: () => void;

  // ========== 组件操作 ==========

  /** 注册组件 */
  registerComponent: (component: RegisteredComponent) => void;

  /** 注销组件 */
  unregisterComponent: (id: string) => void;

  /** 启用组件 */
  enableComponent: (id: string) => void;

  /** 禁用组件 */
  disableComponent: (id: string) => void;

  // ========== 查询方法 ==========

  /** 获取当前筛选条件下的组件列表 */
  getFilteredComponents: () => RegisteredComponent[];

  /** 根据 ID 获取组件 */
  getComponentById: (id: string) => RegisteredComponent | undefined;

  /** 创建组件实例 */
  createInstance: (id: string) => SchemaComponent | null;

  /** 根据类型创建组件实例 */
  createInstanceByType: (type: string) => SchemaComponent | null;

  /** 获取统计信息 */
  getStats: () => {
    total: number;
    official: number;
    community: number;
    local: number;
    installed: number;
    enabled: number;
  };
}

export const useRegistryStore = create<RegistryState>((set, get) => ({
  activeSource: 'official',
  searchQuery: '',
  categoryFilter: null,
  version: 0,

  setActiveSource: (source) => set({ activeSource: source }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  refresh: () => set((state) => ({ version: state.version + 1 })),

  registerComponent: (component) => {
    componentRegistry.register(component);
    get().refresh();
  },

  unregisterComponent: (id) => {
    componentRegistry.unregister(id);
    get().refresh();
  },

  enableComponent: (id) => {
    componentRegistry.enable(id);
    get().refresh();
  },

  disableComponent: (id) => {
    componentRegistry.disable(id);
    get().refresh();
  },

  getFilteredComponents: () => {
    const { activeSource, searchQuery, categoryFilter } = get();

    const options: SearchOptions = {
      source: activeSource,
      installedOnly: true,
      enabledOnly: true,
    };

    if (categoryFilter) {
      options.category = categoryFilter;
    }

    return componentRegistry.search(searchQuery, options);
  },

  getComponentById: (id) => {
    return componentRegistry.getById(id);
  },

  createInstance: (id) => {
    return componentRegistry.createInstance(id);
  },

  createInstanceByType: (type) => {
    return componentRegistry.createInstanceByType(type);
  },

  getStats: () => {
    return componentRegistry.getStats();
  },
}));

// ==================== 便捷 Hooks ====================

/**
 * 获取按来源分组的组件
 */
export function useComponentsBySource(source: ComponentSource, query: string = '') {
  const options: SearchOptions = {
    source,
    installedOnly: source === 'official', // 官方组件总是已安装
    enabledOnly: true,
  };

  return componentRegistry.search(query, options);
}

/**
 * 获取斜杠菜单可用的组件
 */
export function useSlashMenuComponents(query: string = '') {
  return componentRegistry.search(query, {
    installedOnly: true,
    enabledOnly: true,
  });
}

/**
 * 按分类分组组件
 */
export function groupComponentsByCategory(
  components: RegisteredComponent[]
): Record<ComponentCategory, RegisteredComponent[]> {
  const groups: Record<ComponentCategory, RegisteredComponent[]> = {
    basic: [],
    media: [],
    layout: [],
    advanced: [],
    database: [],
    embed: [],
  };

  for (const component of components) {
    if (groups[component.category]) {
      groups[component.category].push(component);
    }
  }

  return groups;
}
