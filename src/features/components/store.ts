import { create } from 'zustand';
import type { ComponentInfo, ComponentCategory, ComponentSchema } from './types';
import {
  loadLocalComponents,
  createLocalComponent,
  updateLocalComponent,
  deleteLocalComponent,
  createDefaultSchema,
} from './services/localComponentService';

interface ComponentDetailState {
  /** 当前查看的组件ID */
  currentComponentId: string | null;
  /** 设置当前组件ID */
  setCurrentComponentId: (id: string | null) => void;
}

export const useComponentDetailStore = create<ComponentDetailState>((set) => ({
  currentComponentId: null,
  setCurrentComponentId: (currentComponentId) => set({ currentComponentId }),
}));

interface LocalComponentsState {
  /** 本地组件列表 */
  localComponents: ComponentInfo[];
  /** 是否正在加载 */
  loading: boolean;
  /** 加载本地组件 */
  loadComponents: () => Promise<void>;
  /** 添加本地组件 */
  addComponent: (
    name: string,
    description: string,
    category: ComponentCategory,
    schema?: ComponentSchema,
    options?: { icon?: string; tags?: string[]; author?: string }
  ) => Promise<ComponentInfo | null>;
  /** 更新本地组件 */
  updateComponent: (
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
  ) => Promise<ComponentInfo | null>;
  /** 删除本地组件 */
  deleteComponent: (componentId: string) => Promise<boolean>;
  /** 根据ID获取组件 */
  getComponentById: (componentId: string) => ComponentInfo | undefined;
}

export const useLocalComponentsStore = create<LocalComponentsState>((set, get) => ({
  localComponents: [],
  loading: false,

  loadComponents: async () => {
    set({ loading: true });
    try {
      const components = await loadLocalComponents();
      set({ localComponents: components });
    } catch (error) {
      console.error('Failed to load local components:', error);
    } finally {
      set({ loading: false });
    }
  },

  addComponent: async (name, description, category, schema, options) => {
    const finalSchema = schema || createDefaultSchema();
    const newComponent = await createLocalComponent(name, description, category, finalSchema, options);

    if (newComponent) {
      set((state) => ({
        localComponents: [...state.localComponents, newComponent],
      }));
    }

    return newComponent;
  },

  updateComponent: async (componentId, updates) => {
    const updatedComponent = await updateLocalComponent(componentId, updates);

    if (updatedComponent) {
      set((state) => ({
        localComponents: state.localComponents.map((c) =>
          c.id === componentId ? updatedComponent : c
        ),
      }));
    }

    return updatedComponent;
  },

  deleteComponent: async (componentId) => {
    const success = await deleteLocalComponent(componentId);

    if (success) {
      set((state) => ({
        localComponents: state.localComponents.filter((c) => c.id !== componentId),
      }));
    }

    return success;
  },

  getComponentById: (componentId) => {
    return get().localComponents.find((c) => c.id === componentId);
  },
}));
