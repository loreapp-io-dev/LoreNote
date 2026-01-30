import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { componentRegistry } from '@/features/components/registry';
import { componentCategories } from '@/features/components/registry/types';
import type { RegisteredComponent, ComponentCategory } from '@/features/components/registry/types';
import * as Icons from 'lucide-react';

interface SlashCommandMenuV8Props {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (component: RegisteredComponent) => void;
  onClose: () => void;
  filter?: string;
}

export function SlashCommandMenuV8({
  isOpen,
  position,
  onSelect,
  onClose,
  filter = '',
}: SlashCommandMenuV8Props) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter components
  const filteredComponents = useMemo(() => {
    return componentRegistry.search(filter, {
      installedOnly: true,
      enabledOnly: true,
      category: activeCategory || undefined,
    });
  }, [filter, activeCategory]);

  // Group by category
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

  // Calculate menu position
  const menuStyle = useMemo(() => {
    const menuWidth = 320;
    const menuHeight = 400;
    const padding = 8;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }

    if (y + menuHeight > window.innerHeight - padding) {
      y = Math.max(padding, position.y - menuHeight - 30);
    }

    if (x < padding) {
      x = padding;
    }

    return { left: x, top: y };
  }, [position.x, position.y]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredComponents.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredComponents[selectedIndex]) {
            onSelect(filteredComponents[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredComponents, selectedIndex, onSelect, onClose]);

  // Reset selected index
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter, activeCategory]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const renderComponent = (comp: RegisteredComponent, index: number) => (
    <button
      key={comp.id}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
        'hover:bg-accent',
        selectedIndex === index && 'bg-accent'
      )}
      onClick={() => onSelect(comp)}
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
    <div
      ref={menuRef}
      data-slash-menu
      className="fixed z-50 w-80 rounded-lg border bg-popover p-2 shadow-lg"
      style={menuStyle}
    >
      {/* Category tabs */}
      {!filter && (
        <div className="mb-2 flex gap-1 border-b pb-2 overflow-x-auto">
          <button
            className={cn(
              'rounded-md px-2 py-1 text-xs whitespace-nowrap',
              !activeCategory ? 'bg-accent' : 'hover:bg-accent/50'
            )}
            onClick={() => setActiveCategory(null)}
          >
            {t.common?.all || 'All'}
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

      {/* Component list */}
      <div className="max-h-80 overflow-y-auto">
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
  );
}
