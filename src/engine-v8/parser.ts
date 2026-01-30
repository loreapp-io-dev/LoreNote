import type { SchemaComponent } from './types';

/**
 * 遍历组件树
 */
export function traverseComponents(
  root: SchemaComponent,
  callback: (component: SchemaComponent, parent?: SchemaComponent) => void,
  parent?: SchemaComponent
): void {
  callback(root, parent);
  root.children?.forEach((child) => {
    if (typeof child !== 'string') {
      traverseComponents(child, callback, root);
    }
  });
}

/**
 * 查找组件
 */
export function findComponent(root: SchemaComponent, id: string): SchemaComponent | null {
  if (root.id === id) return root;

  if (root.children) {
    for (const child of root.children) {
      if (typeof child === 'string') continue;
      const found = findComponent(child, id);
      if (found) return found;
    }
  }

  return null;
}
