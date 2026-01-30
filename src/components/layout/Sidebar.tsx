import {
  Home,
  FolderOpen,
  GitBranch,
  // Sparkles,
  Puzzle,
  Settings,
  Trash2,
  ArrowLeft,
  Wrench,
} from 'lucide-react';
import { useUIStore, useVaultStore, useSettingsStore, useTabStore, type NavItem, DEV_TOOLS_TAB_ID, GRAPH_TAB_ID } from '@/stores';
import { useTranslation } from '@/i18n';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui';

interface SidebarProps {
  titleBarHeight?: number;
}

// 导航按钮样式
const navButtonBase = "flex h-9 w-9 items-center justify-center rounded-lg transition-colors";
const navButtonActive = "bg-neutral-200 text-neutral-900 dark:bg-[#404040] dark:text-[#dcddde]";
const navButtonInactive = "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-[#888] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]";
const navButtonMuted = "text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:text-[#666] dark:hover:bg-[#383838] dark:hover:text-[#888]";

export function Sidebar({ titleBarHeight = 44 }: SidebarProps) {
  const { sidebarOpen, activeNav, activeNavPanel, toggleNavPanel } = useUIStore();
  const { setCurrentVault } = useVaultStore();
  const { openSettings, advanced } = useSettingsStore();
  const { openHomeTab, openTab } = useTabStore();
  const { t } = useTranslation();

  // 折叠状态下不渲染侧边栏
  if (!sidebarOpen) {
    return null;
  }

  // 处理导航点击
  const handleNavClick = (id: NavItem) => {
    if (id === 'devTools') {
      // 开发者工具打开为独立标签页
      openTab(DEV_TOOLS_TAB_ID, t.developerTools.title, 'Wrench', 'lucide');
    } else if (id === 'graph') {
      // 图谱打开为独立标签页
      openTab(GRAPH_TAB_ID, t.nav.graph, 'GitBranch', 'lucide');
    } else {
      toggleNavPanel(id);
    }
  };

  // 导航项配置（不包含开发者工具，开发者工具单独处理）
  const navItems: { id: NavItem; icon: typeof Home; label: string }[] = [
    { id: 'files', icon: FolderOpen, label: t.nav.files },
    { id: 'graph', icon: GitBranch, label: t.nav.graph },
    // { id: 'loreAI', icon: Sparkles, label: t.nav.loreAI },
    { id: 'components', icon: Puzzle, label: t.nav.components },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className="fixed left-0 z-20 flex flex-col rounded-bl-[10px] border-r border-neutral-200 bg-neutral-100 dark:border-[#333] dark:bg-[#252525]"
        style={{
          width: 48,
          top: titleBarHeight,
          height: `calc(100vh - ${titleBarHeight}px)`,
        }}
      >
        {/* 主导航区域 */}
        <div className="flex flex-1 flex-col items-center gap-1 py-2">
          {/* 主页按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => openHomeTab()}
                className={`${navButtonBase} ${navButtonInactive}`}
              >
                <Home size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t.nav.home}
            </TooltipContent>
          </Tooltip>

          {/* 其他导航项 */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`${navButtonBase} ${isActive ? navButtonActive : navButtonInactive}`}
                  >
                    <Icon size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* 开发者工具（仅在开发者模式启用时显示） */}
          {advanced.developerMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavClick('devTools')}
                  className={`${navButtonBase} ${navButtonInactive}`}
                >
                  <Wrench size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t.nav.devTools}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* 底部操作区域 */}
        <div className="flex flex-col items-center gap-1 border-t border-neutral-200 py-2 dark:border-[#333]">
          {/* 设置 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => openSettings()}
                className={`${navButtonBase} ${navButtonInactive}`}
              >
                <Settings size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t.nav.settings}
            </TooltipContent>
          </Tooltip>

          {/* 回收站 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleNavPanel('trash')}
                className={`${navButtonBase} ${activeNavPanel === 'trash' ? navButtonActive : navButtonInactive}`}
              >
                <Trash2 size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t.nav.trash}
            </TooltipContent>
          </Tooltip>

          {/* 返回仓库选择 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCurrentVault(null)}
                className={`${navButtonBase} ${navButtonMuted}`}
              >
                <ArrowLeft size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t.sidebar.backToVaults}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
