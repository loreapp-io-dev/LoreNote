/**
 * 统一斜杠菜单组件
 * 支持官方/社区/本地组件 Tab 切换
 */

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import * as Icons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RegisteredComponent, ComponentSource, ComponentCategory } from '../registry/types';
import { componentCategories } from '../registry/types';
import { componentRegistry } from '../registry';
import { groupComponentsByCategory } from '../store/registry-store';

interface SlashMenuProps {
  /** 搜索关键词 */
  searchQuery: string;
  /** 当前选中索引 */
  selectedIndex: number;
  /** 选中索引变化 */
  onSelectedIndexChange: (index: number) => void;
  /** 选择组件 */
  onSelect: (component: RegisteredComponent) => void;
  /** 关闭菜单 */
  onClose?: () => void;
}

export function SlashMenu({
  searchQuery,
  selectedIndex,
  onSelectedIndexChange,
  onSelect,
  onClose,
}: SlashMenuProps) {
  const { t } = useTranslation();
  const [activeSource, setActiveSource] = useState<ComponentSource>('official');
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | null>(null);

  // 获取组件列表
  const components = useMemo(() => {
    const allComponents = componentRegistry.search(searchQuery, {
      source: activeSource,
      installedOnly: true,
      enabledOnly: true,
      category: activeCategory || undefined,
    });
    return allComponents;
  }, [searchQuery, activeSource, activeCategory]);

  // 按分类分组（只在无搜索和无分类筛选时）
  const groupedComponents = useMemo(() => {
    if (searchQuery || activeCategory) return null;
    return groupComponentsByCategory(components);
  }, [components, searchQuery, activeCategory]);

  // 获取各来源组件数量
  const sourceCounts = useMemo(() => {
    return {
      official: componentRegistry.getBySource('official').filter((c) => c.installed && c.enabled)
        .length,
      community: componentRegistry.getBySource('community').filter((c) => c.installed && c.enabled)
        .length,
      local: componentRegistry.getBySource('local').filter((c) => c.installed && c.enabled).length,
    };
  }, []);

  // 切换来源时重置选中索引
  useEffect(() => {
    onSelectedIndexChange(0);
  }, [activeSource, activeCategory, onSelectedIndexChange]);

  const getIcon = (iconName: string) => {
    const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const getTranslation = (key: string) => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return (value as string) || key;
  };

  const renderComponent = (component: RegisteredComponent, index: number) => (
    <button
      key={component.id}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
        'hover:bg-accent',
        selectedIndex === index && 'bg-accent'
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(component)}
      onMouseEnter={() => onSelectedIndexChange(index)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        {getIcon(component.icon)}
      </span>
      <div className="flex-1 overflow-hidden">
        <div className="font-medium">{getTranslation(component.name)}</div>
        <div className="truncate text-xs text-muted-foreground">
          {getTranslation(component.description)}
        </div>
      </div>
    </button>
  );

  return (
    <div
      className="w-[480px] max-w-[90vw] rounded-lg border bg-popover shadow-lg"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 来源 Tab - 悬浮切换 */}
      <div className="border-b p-2">
        <div className="bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]">
          {(['official', 'community', 'local'] as const).map((source) => (
            <button
              key={source}
              type="button"
              tabIndex={-1}
              className={cn(
                'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors',
                activeSource === source
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onMouseEnter={() => setActiveSource(source)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {getIcon(source === 'official' ? 'Package' : source === 'community' ? 'Users' : 'FolderOpen')}
              <span>
                {source === 'official'
                  ? t.componentLibrary?.tabs?.official || '官方'
                  : source === 'community'
                    ? t.componentLibrary?.tabs?.community || '社区'
                    : t.componentLibrary?.tabs?.local || '本地'}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">({sourceCounts[source]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 分类标签 */}
      {!searchQuery && (
        <div className="flex gap-1 p-2 border-b overflow-x-auto scrollbar-hide">
          <button
            tabIndex={-1}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
              !activeCategory
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActiveCategory(null)}
          >
            {getIcon('LayoutGrid')}
            <span>{t.common?.all || '全部'}</span>
          </button>
          {componentCategories.map((cat) => (
            <button
              key={cat.id}
              tabIndex={-1}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveCategory(cat.id)}
            >
              {getIcon(cat.icon)}
              <span>{getTranslation(cat.name)}</span>
            </button>
          ))}
        </div>
      )}

      {/* 组件列表 */}
      <ScrollArea className="h-80">
        <div className="p-2">
          {groupedComponents ? (
            // 分组显示
            Object.entries(groupedComponents).map(([category, items]) => {
              if (items.length === 0) return null;
              const catDef = componentCategories.find((c) => c.id === category);
              // 计算全局索引
              let globalIndex = 0;
              for (const [cat, cmps] of Object.entries(groupedComponents)) {
                if (cat === category) break;
                globalIndex += cmps.length;
              }
              return (
                <div key={category} className="mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {catDef && getIcon(catDef.icon)}
                    <span>{catDef ? getTranslation(catDef.name) : category}</span>
                  </div>
                  {items.map((comp, i) => renderComponent(comp, globalIndex + i))}
                </div>
              );
            })
          ) : (
            // 平铺显示
            components.map((comp, i) => renderComponent(comp, i))
          )}

          {components.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {activeSource === 'community'
                ? t.componentLibrary?.empty?.community || '暂无社区组件'
                : activeSource === 'local'
                  ? t.componentLibrary?.empty?.local || '暂无本地组件'
                  : t.files?.noMatches || '无匹配结果'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部提示 */}
      <div className="border-t p-2 text-center">
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            onClose?.();
            window.dispatchEvent(new CustomEvent('open-component-library'));
          }}
        >
          {t.componentLibrary?.browseMore || '浏览更多组件...'}
        </button>
      </div>
    </div>
  );
}

export default SlashMenu;
