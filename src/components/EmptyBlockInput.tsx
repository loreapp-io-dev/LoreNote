/** 空块编辑输入框 - 点击空块时显示 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { DataEngine } from '@/engine-v8';
import { savePage } from '@/services/pageService';
import { componentRegistry } from '@/features/components/registry';
import { componentCategories } from '@/features/components/registry/types';
import type { RegisteredComponent, ComponentCategory } from '@/features/components/registry/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useVaultStore } from '@/stores';
import * as Icons from 'lucide-react';

interface EmptyBlockInputProps {
  pageId: string;
  vaultPath: string;
  blockIndex: number;
  onClose: () => void;
  onUpdated: () => void;
}

export function EmptyBlockInput({
  pageId,
  vaultPath,
  blockIndex,
  onClose,
  onUpdated,
}: EmptyBlockInputProps) {
  const { t } = useTranslation();
  const pages = useVaultStore((state) => state.pages);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | null>(null);

  const isSlashMode = value.startsWith('/');
  const filter = isSlashMode ? value.slice(1) : '';

  const filteredComponents = useMemo(() => {
    return componentRegistry.search(filter, {
      installedOnly: true,
      enabledOnly: true,
      category: activeCategory || undefined,
    });
  }, [filter, activeCategory]);

  const groupedComponents = useMemo(() => {
    if (filter || activeCategory) return null;
    const groups: Record<ComponentCategory, RegisteredComponent[]> = {
      basic: [],
      media: [],
      layout: [],
      advanced: [],
      database: [],
      embed: [],
    };
    filteredComponents.forEach((comp) => {
      if (groups[comp.category]) {
        groups[comp.category].push(comp);
      }
    });
    return groups;
  }, [filteredComponents, filter, activeCategory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter, activeCategory]);

  // 替换空块为新组件
  const replaceEmptyBlock = (newComponent: ReturnType<typeof componentRegistry.createInstance>) => {
    if (!newComponent) return;
    const schema = DataEngine.readPage(pageId, vaultPath);
    if (schema && schema.children) {
      const children = [...schema.children];
      children[blockIndex] = newComponent;
      const updatedSchema = { ...schema, children };
      DataEngine.setPage(pageId, vaultPath, updatedSchema);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
      window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
    }
    onClose();
    onUpdated();
  };

  const handleComponentSelect = (component: RegisteredComponent) => {
    replaceEmptyBlock(componentRegistry.createInstance(component.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && !isSlashMode) {
      e.preventDefault();
      // 有内容：替换为文本块
      const newComponent = componentRegistry.createInstanceByType('text');
      if (newComponent) {
        if (value.trim()) {
          newComponent.data = { ...newComponent.data, content: value };
        }
        replaceEmptyBlock(newComponent);
      }
    } else if (isSlashMode) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredComponents.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredComponents[selectedIndex]) {
          handleComponentSelect(filteredComponents[selectedIndex]);
        }
      }
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const getTranslation = (key: string) => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = t;
    for (const k of keys) val = val?.[k];
    return (val as string) || key;
  };

  const renderComponent = (comp: RegisteredComponent, index: number) => (
    <button
      key={comp.id}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
        selectedIndex === index && 'bg-accent'
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => handleComponentSelect(comp)}
      onMouseEnter={() => setSelectedIndex(index)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        {getIcon(comp.icon)}
      </span>
      <div className="flex-1 overflow-hidden">
        <div className="font-medium">{getTranslation(comp.name)}</div>
        <div className="truncate text-xs text-muted-foreground">
          {getTranslation(comp.description)}
        </div>
      </div>
    </button>
  );

  return (
    <div ref={containerRef} className="py-1">
      <div className={`px-2 py-1 rounded ${isSlashMode ? 'bg-background shadow-sm border' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full outline-none bg-transparent text-foreground"
          placeholder={
            isSlashMode
              ? t.editor?.filterPlaceholder || '筛选'
              : t.editor?.inputPlaceholder || '输入文本，按"/"启用指令'
          }
        />
      </div>

      {isSlashMode && (
        <div className="mt-1 w-80 rounded-lg border bg-popover p-2 shadow-lg inline-block">
          {!filter && (
            <div className="mb-2 flex gap-1 border-b pb-2 overflow-x-auto">
              <button
                className={cn(
                  'rounded-md px-2 py-1 text-xs whitespace-nowrap',
                  !activeCategory ? 'bg-accent' : 'hover:bg-accent/50'
                )}
                onClick={() => setActiveCategory(null)}
              >
                {t.common?.all || '全部'}
              </button>
              {componentCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs whitespace-nowrap',
                    activeCategory === cat.id ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {getTranslation(cat.name)}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded">
            {groupedComponents ? (
              Object.entries(groupedComponents).map(([category, components]) => {
                if (components.length === 0) return null;
                const catDef = componentCategories.find((c) => c.id === category);
                let globalIndex = 0;
                for (const [cat, comps] of Object.entries(groupedComponents)) {
                  if (cat === category) break;
                  globalIndex += comps.length;
                }
                return (
                  <div key={category} className="mb-2">
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                      {catDef ? getTranslation(catDef.name) : category}
                    </div>
                    {components.map((comp, i) => renderComponent(comp, globalIndex + i))}
                  </div>
                );
              })
            ) : (
              filteredComponents.map((comp, i) => renderComponent(comp, i))
            )}
            {filteredComponents.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {t.files?.noMatches || 'No matches found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
