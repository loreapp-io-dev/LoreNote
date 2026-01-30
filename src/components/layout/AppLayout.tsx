import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { TopBar } from './TopBar';
import { EditorArea } from './EditorArea';
import { FloatingToolbar } from '@/components/toolbar';
import { FileExplorer } from '@/features/files';
import { TrashPanel } from '@/features/trash';
import { ComponentsPanel, ComponentDetailPage, useComponentDetailStore } from '@/features/components';
import { DeveloperToolsPage } from '@/features/developerTools';
import { HomePage } from '@/features/home';
import { GraphPanel } from '@/features/graph';
import { RightPanel } from '@/features/backlinks';
import { useUIStore, useTabStore, useActivePageId, HOME_PAGE_ID, COMPONENT_DETAIL_TAB_ID, DEV_TOOLS_TAB_ID, GRAPH_TAB_ID, useVaultStore } from '@/stores';
import { useTranslation } from '@/i18n';

interface AppLayoutProps {
  children?: ReactNode;
}

const TITLE_BAR_HEIGHT = 44; // h-11 = 2.75rem = 44px

const NAV_SIDEBAR_WIDTH = 48; // 图标导航栏宽度

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, activeNavPanel, secondaryPanelWidth, componentsPanelWidth, rightPanelOpen, rightPanelWidth, setActiveNavPanel, setSidebarOpen } = useUIStore();
  const tabs = useTabStore((state) => state.tabs);
  const activePageId = useActivePageId();
  const { currentComponentId } = useComponentDetailStore();
  const currentVault = useVaultStore(state => state.currentVault);
  const { t } = useTranslation();

  // 监听打开组件库事件
  useEffect(() => {
    const handleOpenComponentLibrary = () => {
      setSidebarOpen(true);
      setActiveNavPanel('components');
    };

    window.addEventListener('open-component-library', handleOpenComponentLibrary);
    return () => {
      window.removeEventListener('open-component-library', handleOpenComponentLibrary);
    };
  }, [setSidebarOpen, setActiveNavPanel]);

  // 计算主内容区的左边距
  const showSecondaryPanel = activeNavPanel === 'files' || activeNavPanel === 'trash' || activeNavPanel === 'components';
  const getPanelWidth = () => {
    if (activeNavPanel === 'components') return componentsPanelWidth;
    return secondaryPanelWidth;
  };
  const panelWidth = getPanelWidth();
  const contentMarginLeft = sidebarOpen
    ? NAV_SIDEBAR_WIDTH + (showSecondaryPanel ? panelWidth : 0)
    : 0;

  // 是否有打开的标签页
  const hasOpenTabs = tabs.length > 0;

  // 当前是否显示主页
  const isHomePage = activePageId === HOME_PAGE_ID;

  // 当前是否显示组件详情页
  const isComponentDetail = activePageId === COMPONENT_DETAIL_TAB_ID;

  // 当前是否显示开发者工具页
  const isDevToolsPage = activePageId === DEV_TOOLS_TAB_ID;

  // 当前是否显示图谱页
  const isGraphPage = activePageId === GRAPH_TAB_ID;

  // 是否显示普通笔记页（非特殊页面）
  const isNotePage = hasOpenTabs && !isHomePage && !isDevToolsPage && !isGraphPage && !isComponentDetail;

  // 是否显示右侧面板（仅在普通笔记页且有当前页面时显示）
  const showRightPanel = isNotePage && rightPanelOpen && currentVault && activePageId;

  // 计算主内容区的右边距
  const contentMarginRight = showRightPanel ? rightPanelWidth : 0;

  return (
    <div className="window-container relative flex h-screen w-screen flex-col overflow-hidden">
      {/* 背景层 */}
      <div className="absolute inset-0 rounded-[10px] bg-white dark:bg-[#1e1e1e]" />
      {/* 自定义标题栏 - 固定在顶部 */}
      <TitleBar />

      {/* 内容区域 */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar titleBarHeight={TITLE_BAR_HEIGHT} />

        {/* 二级面板 - 文件浏览器 */}
        {sidebarOpen && activeNavPanel === 'files' && (
          <div
            className="fixed z-10"
            style={{
              left: NAV_SIDEBAR_WIDTH,
              top: TITLE_BAR_HEIGHT,
            }}
          >
            <FileExplorer titleBarHeight={TITLE_BAR_HEIGHT} />
          </div>
        )}

        {/* 二级面板 - 回收站 */}
        {sidebarOpen && activeNavPanel === 'trash' && (
          <div
            className="fixed z-10"
            style={{
              left: NAV_SIDEBAR_WIDTH,
              top: TITLE_BAR_HEIGHT,
            }}
          >
            <TrashPanel titleBarHeight={TITLE_BAR_HEIGHT} />
          </div>
        )}

        {/* 二级面板 - 组件库 */}
        {sidebarOpen && activeNavPanel === 'components' && (
          <div
            className="fixed z-10"
            style={{
              left: NAV_SIDEBAR_WIDTH,
              top: TITLE_BAR_HEIGHT,
            }}
          >
            <ComponentsPanel titleBarHeight={TITLE_BAR_HEIGHT} />
          </div>
        )}

        {/* 主内容区 */}
        <div
          className="flex flex-1 flex-col overflow-hidden transition-[margin] duration-200"
          style={{ marginLeft: contentMarginLeft, marginRight: contentMarginRight }}
        >
          {hasOpenTabs ? (
            isHomePage ? (
              // 主页
              <main className="flex-1 overflow-y-auto bg-white dark:bg-[#1e1e1e]">
                <HomePage />
              </main>
            ) : isDevToolsPage ? (
              // 开发者工具页
              <main className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
                <DeveloperToolsPage />
              </main>
            ) : isGraphPage && currentVault ? (
              // 关系图谱页
              <main className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
                <GraphPanel vaultPath={currentVault.path} />
              </main>
            ) : isComponentDetail && currentComponentId ? (
              // 组件详情页
              <main className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
                <ComponentDetailPage componentId={currentComponentId} />
              </main>
            ) : (
              // 普通笔记页
              <>
                <TopBar />
                <EditorArea>{children}</EditorArea>
              </>
            )
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center text-neutral-400 dark:text-[#666]">
                <p className="text-sm">{t.tabs.noOpenTabs}</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧面板 - 反向链接 */}
        {showRightPanel && currentVault && activePageId && (
          <div
            className="fixed right-0 z-10 border-l border-border bg-background overflow-y-auto"
            style={{
              top: TITLE_BAR_HEIGHT,
              width: rightPanelWidth,
              height: `calc(100vh - ${TITLE_BAR_HEIGHT}px)`,
            }}
          >
            <RightPanel
              pageId={activePageId}
              vaultPath={currentVault.path}
            />
          </div>
        )}
      </div>

      {/* 悬浮格式工具栏 */}
      <FloatingToolbar />
    </div>
  );
}
