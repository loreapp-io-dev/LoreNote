import { useState, useRef } from 'react';
import {
  MoreHorizontal,
  Star,
  Share2,
  MessageSquare,
  Clock,
  PanelRight,
} from 'lucide-react';
import { useVaultStore, useTabStore, useUIStore } from '@/stores';
import { useHasUnsavedChanges } from '@/stores/editorSelectors';
import { IconButton } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { HOME_PAGE_ID } from '@/stores/tabStore';

export function TopBar() {
  const { t } = useTranslation();
  const { pages, updatePage } = useVaultStore();
  const { tabs, activeTabId, updateTabTitle } = useTabStore();
  const { rightPanelOpen, toggleRightPanel } = useUIStore();
  const hasUnsavedChanges = useHasUnsavedChanges(activeTabId || '');

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const currentPage = activeTab ? pages.find((p) => p.id === activeTab.pageId) : null;

  // 优先使用 pages 中的最新标题，回退到 tab.title
  const displayTitle = currentPage?.title || activeTab?.title || '';

  // 重命名状态
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 是否可以重命名（只有笔记页面可以重命名）
  const canRename = activeTab && activeTab.pageId !== HOME_PAGE_ID && currentPage;

  /** 检查是否存在同名页面（排除自身） */
  const checkPageNameExists = (pageName: string): boolean => {
    if (!currentPage) return false;
    return pages.some(
      (p) =>
        p.id !== currentPage.id &&
        p.parentId === currentPage.parentId &&
        p.title.toLowerCase() === pageName.toLowerCase()
    );
  };

  /** 双击开始重命名 */
  const handleDoubleClick = () => {
    if (!canRename || !currentPage) return;
    setIsRenaming(true);
    setRenameValue(currentPage.title);
    setRenameError(null);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  /** 提交重命名 */
  const handleRenameSubmit = () => {
    if (!currentPage || !activeTab) return;
    const trimmedName = renameValue.trim();
    if (trimmedName && trimmedName !== currentPage.title) {
      if (checkPageNameExists(trimmedName)) {
        setRenameError(t.files?.pageNameExists || '');
        inputRef.current?.focus();
        return;
      }
      updatePage(currentPage.id, { title: trimmedName });
      updateTabTitle(activeTab.id, trimmedName);
    }
    setIsRenaming(false);
    setRenameError(null);
  };

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* 左侧 - 面包屑/标题 */}
      <div className="flex items-center gap-2">
        {activeTab ? (
          <>
            {isRenaming ? (
              <div className="flex flex-col">
                <input
                  ref={inputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    setRenameError(null);
                  }}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') {
                      setIsRenaming(false);
                      setRenameError(null);
                    }
                  }}
                  style={{ width: `${Math.max(renameValue.length, 1) + 1}ch` }}
                  className={`rounded bg-muted px-1 text-sm font-medium outline-none ${
                    renameError ? 'ring-1 ring-red-500' : ''
                  }`}
                />
                {renameError && (
                  <span className="mt-0.5 text-xs text-red-500">{renameError}</span>
                )}
              </div>
            ) : (
              <span
                className={`text-sm font-medium text-foreground ${canRename ? 'cursor-text' : ''}`}
                onDoubleClick={handleDoubleClick}
                title={canRename ? t.topbar.doubleClickToRename : undefined}
              >
                {displayTitle}
              </span>
            )}
            {hasUnsavedChanges && !isRenaming && (
              <span className="text-xs text-muted-foreground">• {t.editor.unsavedChanges}</span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{t.editor.selectOrCreate}</span>
        )}
      </div>

      {/* 右侧 - 操作按钮 */}
      <div className="flex items-center gap-1">
        <IconButton icon={Clock} size="sm" title={t.topbar.history} />
        <IconButton icon={MessageSquare} size="sm" title={t.topbar.comments} />
        <IconButton icon={Star} size="sm" title={t.topbar.favorite} />
        <IconButton icon={Share2} size="sm" title={t.topbar.share} />
        <IconButton icon={MoreHorizontal} size="sm" title={t.topbar.more} />
        <div className="ml-2 border-l border-border pl-2">
          <IconButton
            icon={PanelRight}
            size="sm"
            title={t.topbar?.toggleRightPanel || '切换右侧面板'}
            active={rightPanelOpen}
            onClick={toggleRightPanel}
          />
        </div>
      </div>
    </header>
  );
}
