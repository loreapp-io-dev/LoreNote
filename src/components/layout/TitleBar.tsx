import { useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { PanelLeftClose, PanelLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore, useTabStore } from '@/stores';
import { useHasUnsavedChanges } from '@/stores/editorSelectors';
import { useTranslation } from '@/i18n';
import { usePage } from '@/features/vault';
import { TabBar } from './TabBar';
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

// 侧边栏宽度 + 文件浏览器宽度
const NAV_SIDEBAR_WIDTH = 48;

export function TitleBar() {
  const { sidebarOpen, toggleSidebar, activeNavPanel, secondaryPanelWidth } = useUIStore();
  const { goBack, goForward, canGoBack, canGoForward } = useTabStore();
  const hasUnsavedChanges = useHasUnsavedChanges(useTabStore((state) => state.activeTabId) || '');
  const { saveCurrentPage } = usePage();
  const [isHovered, setIsHovered] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const { t } = useTranslation();

  // 计算标签页区域的左边距
  const tabBarMarginLeft = sidebarOpen
    ? NAV_SIDEBAR_WIDTH + (activeNavPanel === 'files' ? secondaryPanelWidth : 0)
    : 0;

  const handleClose = async () => {
    if (hasUnsavedChanges) {
      setShowCloseDialog(true);
    } else {
      await getCurrentWindow().close();
    }
  };

  const handleSaveAndClose = async () => {
    await saveCurrentPage();
    setShowCloseDialog(false);
    await getCurrentWindow().close();
  };

  const handleDiscardAndClose = async () => {
    setShowCloseDialog(false);
    await getCurrentWindow().close();
  };

  const handleMinimize = async () => {
    await getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    const window = getCurrentWindow();
    const isMaximized = await window.isMaximized();
    if (isMaximized) {
      await window.unmaximize();
    } else {
      await window.maximize();
    }
  };

  return (
    <>
      <div
        className="relative z-10 flex h-11 shrink-0 items-center justify-between rounded-t-[10px] bg-neutral-100/80 px-3 dark:bg-[#2a2a2a]"
        data-tauri-drag-region
      >
        {/* 左侧 - 窗口控制按钮 + 侧边栏切换 */}
        <div className="flex items-center gap-3">
          {/* macOS 风格窗口控制按钮 */}
          <div
            className="flex items-center gap-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* 关闭按钮 - 红色 */}
            <button
              onClick={handleClose}
              className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#FF5F57] transition-colors hover:bg-[#FF5F57]/80"
              title={t.window.close}
            >
              {isHovered && (
                <svg
                  className="h-2 w-2 text-[#4D0000]"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 2l6 6M8 2l-6 6" />
                </svg>
              )}
            </button>

            {/* 最小化按钮 - 黄色 */}
            <button
              onClick={handleMinimize}
              className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#FEBC2E] transition-colors hover:bg-[#FEBC2E]/80"
              title={t.window.minimize}
            >
              {isHovered && (
                <svg
                  className="h-2 w-2 text-[#995700]"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 5h6" />
                </svg>
              )}
            </button>

            {/* 最大化按钮 - 绿色 */}
            <button
              onClick={handleMaximize}
              className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#28C840] transition-colors hover:bg-[#28C840]/80"
              title={t.window.maximize}
            >
              {isHovered && (
                <svg
                  className="h-2 w-2 text-[#006500]"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 3.5L5 1l3 2.5M2 6.5L5 9l3-2.5" />
                </svg>
              )}
            </button>
          </div>

          {/* 分隔线 */}
          <div className="h-4 w-px bg-neutral-200 dark:bg-[#404040]" />

          {/* 侧边栏切换按钮 */}
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-[#888] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]"
            title={sidebarOpen ? t.sidebar.hideSidebar : t.sidebar.showSidebar}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
        </div>

        {/* 中间 - 导航按钮 + 标签页区域 */}
        <div
          className="flex min-w-0 flex-1 items-center transition-[margin] duration-200"
          style={{ marginLeft: tabBarMarginLeft }}
          data-tauri-drag-region
        >
          {/* 前进/后退按钮 */}
          <div className="flex items-center gap-0.5 pr-2">
            <button
              onClick={goBack}
              disabled={!canGoBack()}
              className={`
                flex h-6 w-6 items-center justify-center rounded-md transition-colors
                ${
                  canGoBack()
                    ? 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-[#888] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]'
                    : 'cursor-not-allowed text-neutral-300 dark:text-[#555]'
                }
              `}
              title={t.nav.back}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward()}
              className={`
                flex h-6 w-6 items-center justify-center rounded-md transition-colors
                ${
                  canGoForward()
                    ? 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-[#888] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]'
                    : 'cursor-not-allowed text-neutral-300 dark:text-[#555]'
                }
              `}
              title={t.nav.forward}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 标签页 */}
          <TabBar />

          {/* 可拖拽区域 */}
          <div className="min-w-[60px] flex-1" data-tauri-drag-region />
        </div>
      </div>

      {/* 关闭窗口时未保存更改确认对话框 */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tabs.unsavedChangesTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tabs.unsavedChangesDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
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
