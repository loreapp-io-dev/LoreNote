import { Star, Download, Check, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { ComponentInfo } from '../types';
import { useTranslation } from '@/i18n';
import { useTabStore, COMPONENT_DETAIL_TAB_ID } from '@/stores';
import { useComponentDetailStore } from '../store';
import { cn } from '@/lib/utils';

interface ComponentCardProps {
  component: ComponentInfo;
  onInstall?: (id: string) => void;
}

export function ComponentCard({ component, onInstall }: ComponentCardProps) {
  const { t } = useTranslation();
  const { openTab, findTabByPageId, setActiveTab, updateTabTitle, updateTabIcon } = useTabStore();
  const { setCurrentComponentId } = useComponentDetailStore();

  // 动态获取图标
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[component.icon] || Icons.Box;

  // 获取翻译文本
  const getTranslatedText = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  // 格式化下载数
  const formatDownloads = (num: number): string => {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const name = component.name.startsWith('componentLibrary.')
    ? getTranslatedText(component.name)
    : component.name;

  const description = component.description.startsWith('componentLibrary.')
    ? getTranslatedText(component.description)
    : component.description;

  // 点击卡片打开详情页（复用同一个标签页）
  const handleCardClick = () => {
    // 设置当前查看的组件ID
    setCurrentComponentId(component.id);

    // 检查是否已存在组件详情标签页
    const existingTab = findTabByPageId(COMPONENT_DETAIL_TAB_ID);
    if (existingTab) {
      // 更新标签页标题和图标，切换到该标签页
      updateTabTitle(existingTab.id, name);
      updateTabIcon(existingTab.id, component.icon, 'lucide');
      setActiveTab(existingTab.id);
    } else {
      // 创建新的组件详情标签页
      openTab(COMPONENT_DETAIL_TAB_ID, name, component.icon, 'lucide');
    }
  };

  // 处理安装按钮点击（阻止冒泡）
  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInstall?.(component.id);
  };

  // 分类颜色映射
  const categoryColors: Record<string, string> = {
    basic: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    media: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    layout: 'bg-green-500/10 text-green-600 dark:text-green-400',
    advanced: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    database: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    embed: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    inline: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    interactive: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/40 hover:bg-accent/20 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted/80 transition-colors group-hover:bg-primary/10">
          <IconComponent size={20} className="text-muted-foreground transition-colors group-hover:text-primary" />
        </div>

        {/* 内容 */}
        <div className="min-w-0 flex-1">
          {/* 名称和分类 */}
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">{name}</h3>
            <span className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium',
              categoryColors[component.category] || 'bg-muted text-muted-foreground'
            )}>
              {getTranslatedText(`componentLibrary.categories.${component.category}`)}
            </span>
          </div>

          {/* 描述 */}
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{description}</p>

          {/* 底部信息 */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {/* 版本 */}
              <span className="rounded bg-muted/60 px-1.5 py-0.5">v{component.version}</span>

              {/* 本地组件标签 */}
              {component.source === 'local' && (
                <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-blue-600 dark:text-blue-400">
                  {t.componentLibrary.card.local}
                </span>
              )}

              {/* 评分（社区组件） */}
              {component.source === 'community' && component.rating && (
                <span className="flex items-center gap-0.5">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {component.rating.toFixed(1)}
                </span>
              )}

              {/* 下载量（社区组件） */}
              {component.source === 'community' && component.downloads && (
                <span className="flex items-center gap-0.5">
                  <Download size={11} />
                  {formatDownloads(component.downloads)}
                </span>
              )}
            </div>

            {/* 安装状态/按钮 */}
            {component.source === 'community' && (
              <div className="flex-shrink-0">
                {component.installed ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <Check size={12} />
                    {t.componentLibrary.card.installed}
                  </span>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t.componentLibrary.card.install}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
