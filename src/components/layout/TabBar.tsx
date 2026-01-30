import { useState, useRef, useEffect, useCallback } from 'react';
import { useTabStore } from '@/stores';
import { useHasUnsavedChanges } from '@/stores/editorSelectors';
import { useTranslation } from '@/i18n';
import { usePage } from '@/features/vault';
import { TabItem } from './TabItem';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string | null;
}

interface PendingCloseState {
  type: 'single' | 'others' | 'all' | 'toRight';
  tabId: string | null;
}

export function TabBar() {
  const { t } = useTranslation();
  const { tabs, activeTabId, setActiveTab, closeTab, closeOtherTabs, closeAllTabs, closeTabsToRight } =
    useTabStore();
  const hasUnsavedChanges = useHasUnsavedChanges(activeTabId || '');
  const { saveCurrentPage } = usePage();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tabId: null,
  });

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState<PendingCloseState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 执行关闭操作
  const executeClose = useCallback((closeState: PendingCloseState) => {
    switch (closeState.type) {
      case 'single':
        if (closeState.tabId) closeTab(closeState.tabId);
        break;
      case 'others':
        if (closeState.tabId) closeOtherTabs(closeState.tabId);
        break;
      case 'all':
        closeAllTabs();
        break;
      case 'toRight':
        if (closeState.tabId) closeTabsToRight(closeState.tabId);
        break;
    }
  }, [closeTab, closeOtherTabs, closeAllTabs, closeTabsToRight]);

  // 检查是否需要确认
  const needsConfirmation = useCallback((closeState: PendingCloseState): boolean => {
    // 只有关闭当前活动标签页且有未保存更改时才需要确认
    if (!hasUnsavedChanges) return false;

    switch (closeState.type) {
      case 'single':
        return closeState.tabId === activeTabId;
      case 'others':
        // 关闭其他不影响当前标签
        return false;
      case 'all':
        // 关闭全部包含当前标签
        return true;
      case 'toRight':
        // 关闭右侧不影响当前标签（除非当前在左侧被关闭）
        return false;
    }
  }, [hasUnsavedChanges, activeTabId]);

  // 尝试关闭，如果需要确认则显示对话框
  const tryClose = useCallback((closeState: PendingCloseState) => {
    if (needsConfirmation(closeState)) {
      setPendingClose(closeState);
      setShowUnsavedDialog(true);
    } else {
      executeClose(closeState);
    }
  }, [needsConfirmation, executeClose]);

  const handleTabClose = (tabId: string) => {
    tryClose({ type: 'single', tabId });
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  const handleCloseTab = () => {
    if (contextMenu.tabId) {
      tryClose({ type: 'single', tabId: contextMenu.tabId });
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseOthers = () => {
    if (contextMenu.tabId) {
      tryClose({ type: 'others', tabId: contextMenu.tabId });
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseAll = () => {
    tryClose({ type: 'all', tabId: null });
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseToRight = () => {
    if (contextMenu.tabId) {
      tryClose({ type: 'toRight', tabId: contextMenu.tabId });
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // 保存并关闭
  const handleSaveAndClose = async () => {
    if (pendingClose) {
      await saveCurrentPage();
      executeClose(pendingClose);
    }
    setShowUnsavedDialog(false);
    setPendingClose(null);
  };

  // 不保存直接关闭
  const handleDiscardAndClose = () => {
    if (pendingClose) {
      executeClose(pendingClose);
    }
    setShowUnsavedDialog(false);
    setPendingClose(null);
  };

  // 取消关闭
  const handleCancelClose = () => {
    setShowUnsavedDialog(false);
    setPendingClose(null);
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={containerRef}
        className="flex items-center gap-1 overflow-x-auto px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={handleTabClick}
            onClose={handleTabClose}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
          />
          <div
            className="fixed z-50 min-w-[160px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-[#404040] dark:bg-[#2b2b2b]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="flex w-full items-center px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
              onClick={handleCloseTab}
            >
              {t.tabs.closeTab}
            </button>
            <button
              className="flex w-full items-center px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
              onClick={handleCloseOthers}
            >
              {t.tabs.closeOthers}
            </button>
            <button
              className="flex w-full items-center px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
              onClick={handleCloseToRight}
            >
              {t.tabs.closeToRight}
            </button>
            <div className="my-1 border-t border-neutral-200 dark:border-[#404040]" />
            <button
              className="flex w-full items-center px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
              onClick={handleCloseAll}
            >
              {t.tabs.closeAll}
            </button>
          </div>
        </>
      )}

      {/* 未保存更改确认对话框 */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tabs.unsavedChangesTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tabs.unsavedChangesDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.tabs.discardAndClose}
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndClose}>
              {t.tabs.saveAndClose}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
