import { useState, type ReactNode } from 'react';
import { GripVertical, Plus, MoreHorizontal } from 'lucide-react';
import type { Component } from '@/types';
import { useTabStore } from '@/stores';
import { useIsBlockSelected, useIsBlockFocused } from '@/stores/editorSelectors';
import { IconButton } from '@/components/ui';

interface BlockWrapperProps {
  component: Component;
  children: ReactNode;
}

export function BlockWrapper({ component, children }: BlockWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { activeTabId } = useTabStore();
  const isSelected = useIsBlockSelected(component.id || '');
  const isFocused = useIsBlockFocused(component.id || '');

  // Ensure activeTabId is used to avoid unused variable warning
  void activeTabId;

  return (
    <div
      className={`
        group relative flex items-start
        ${isSelected ? 'bg-blue-50 dark:bg-[#7f6df2]/10' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left action bar */}
      <div
        className={`
          absolute -left-14 flex items-center gap-0.5 transition-opacity
          ${isHovered || isSelected || isFocused ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <IconButton icon={Plus} size="sm" title="Add block" />
        <div className="cursor-grab active:cursor-grabbing">
          <IconButton icon={GripVertical} size="sm" title="Drag" />
        </div>
      </div>

      {/* Content area */}
      <div className="w-full">{children}</div>

      {/* Right more menu */}
      <div
        className={`
          absolute -right-8 top-0 transition-opacity
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <IconButton icon={MoreHorizontal} size="sm" title="More" />
      </div>
    </div>
  );
}
