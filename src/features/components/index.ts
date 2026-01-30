export { ComponentsPanel } from './components/ComponentsPanel';
export { ComponentCard } from './components/ComponentCard';
export { ComponentDetailPage } from './components/ComponentDetailPage';
export { useComponentDetailStore, useLocalComponentsStore } from './store';
export * from './types';
export * from './services/localComponentService';

// Registry exports
export { componentRegistry, ComponentRegistry } from './registry';
export { officialComponents } from './registry/official-components';
export { useRegistryStore, groupComponentsByCategory } from './store/registry-store';
export type {
  RegisteredComponent,
  ComponentSource,
  ComponentCategory,
  CategoryDefinition,
  SearchOptions,
  ExportedComponent,
} from './registry/types';
export { componentCategories } from './registry/types';
