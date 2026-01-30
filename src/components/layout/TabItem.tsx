import { useState } from 'react';
import { X, File } from 'lucide-react';
import type { Tab } from '@/stores';
import type { IconType } from '@/types';
import { renderItemIcon } from '@/features/files/utils/iconUtils';
import { useTranslation } from '@/i18n';

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onClose: (tabId: string) => void;
  onClick: (tabId: string) => void;
  onContextMenu?: (e: React.MouseEvent, tabId: string) => void;
}

export function TabItem({
  tab,
  isActive,
  onClose,
  onClick,
  onContextMenu,
}: TabItemProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, tab.id);
  };

  return (
    <div
      className={`
        group relative flex h-8 min-w-[120px] max-w-[240px] cursor-pointer items-center gap-2 px-3
        transition-all duration-150
        ${
          isActive
            ? 'text-neutral-900 dark:text-white'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-[#888] dark:hover:text-[#bbb]'
        }
      `}
      onClick={() => onClick(tab.id)}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 图标 */}
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        {tab.icon ? (
          renderItemIcon(tab.icon, tab.iconType as IconType, 15)
        ) : (
          <File size={15} className={isActive ? 'text-neutral-600 dark:text-[#aaa]' : 'text-neutral-400 dark:text-[#666]'} />
        )}
      </div>

      {/* 标题 */}
      <span className="flex-1 truncate text-[13px] font-medium">{tab.title}</span>

      {/* 关闭按钮 */}
      <button
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all
          ${
            isHovered || isActive
              ? 'opacity-100'
              : 'opacity-0'
          }
          hover:bg-neutral-200 dark:hover:bg-[#404040]
        `}
        onClick={handleClose}
        title={t.tabs.closeTab}
      >
        <X size={14} />
      </button>

      {/* Notion 风格底部指示线 */}
      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-neutral-900 dark:bg-white" />
      )}
    </div>
  );
}
