import { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useUIStore } from '@/stores';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@/components/ui';
import { ComponentCard } from './ComponentCard';
import { componentRegistry } from '../registry';
import { componentCategories } from '../registry/types';
import type { ComponentSource, RegisteredComponent } from '../registry/types';
import { useLocalComponentsStore } from '../store';

interface ComponentsPanelProps {
  titleBarHeight?: number;
}

export function ComponentsPanel({ titleBarHeight = 44 }: ComponentsPanelProps) {
  const { t } = useTranslation();
  const { componentsPanelWidth } = useUIStore();
  const { localComponents } = useLocalComponentsStore();

  // 状态
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ComponentSource>('official');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 筛选组件
  const filteredComponents = useMemo(() => {
    // 从 Registry 获取组件
    let components: RegisteredComponent[];

    if (activeTab === 'local') {
      // 本地组件从 store 获取，转换为 RegisteredComponent 格式
      components = localComponents.map((c) => ({
        ...c,
        source: 'local' as ComponentSource,
        enabled: true,
        keywords: c.tags || [],
      })) as RegisteredComponent[];
    } else {
      components = componentRegistry.search('', {
        source: activeTab,
        installedOnly: true,
        enabledOnly: true,
      });
    }

    // 按分类筛选
    if (categoryFilter && categoryFilter !== 'all') {
      components = components.filter((c) => c.category === categoryFilter);
    }

    // 搜索
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      components = components.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.keywords?.some((kw) => kw.toLowerCase().includes(q)) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return components;
  }, [searchQuery, activeTab, categoryFilter, localComponents]);

  // 获取翻译
  const getTranslatedText = (key: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return (value as string) || key;
  };

  // 处理安装
  const handleInstall = (id: string) => {
    console.log('Installing component:', id);
    componentRegistry.markInstalled(id);
  };

  // 组件数量
  const sourceCounts = useMemo(
    () => ({
      official: componentRegistry.getBySource('official').filter((c) => c.installed && c.enabled)
        .length,
      community: componentRegistry.getBySource('community').filter((c) => c.installed && c.enabled)
        .length,
      local: localComponents.length,
    }),
    [localComponents]
  );

  // 处理创建本地组件
  const handleCreateLocal = () => {
    window.dispatchEvent(new CustomEvent('open-create-component-dialog'));
  };

  // 组件列表渲染
  const renderComponentList = () => (
    <ScrollArea className="h-full">
      <div className="p-2">
        {filteredComponents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={{
                  id: component.id,
                  type: component.type,
                  name: component.name,
                  description: component.description,
                  icon: component.icon,
                  category: component.category,
                  source: component.source,
                  version: component.version,
                  author: component.author,
                  downloads: component.downloads,
                  rating: component.rating,
                  installed: component.installed,
                  tags: component.tags,
                  createdAt: component.createdAt,
                  updatedAt: component.updatedAt,
                }}
                onInstall={handleInstall}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <p>
              {searchQuery
                ? t.componentLibrary.noResults
                : t.componentLibrary.empty?.[activeTab] || t.componentLibrary.noResults}
            </p>
            {activeTab === 'local' && !searchQuery && (
              <Button variant="outline" size="sm" onClick={handleCreateLocal}>
                <Plus className="mr-1 h-4 w-4" />
                {t.componentLibrary.local.create}
              </Button>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div
      className="flex flex-col border-r border-border bg-background"
      style={{
        width: componentsPanelWidth,
        height: `calc(100vh - ${titleBarHeight}px)`,
      }}
    >
      {/* 标题栏 */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-border px-3">
        <h2 className="text-sm font-medium text-foreground">{t.componentLibrary.title}</h2>
        {activeTab === 'local' && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateLocal}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 搜索和筛选区域 */}
      <div className="flex-shrink-0 space-y-2 border-b border-border p-3">
        {/* 搜索框 */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.componentLibrary.searchPlaceholder}
            className="w-full rounded-md border border-border bg-muted/50 py-1.5 pl-8 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 分类筛选 */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger size="sm" className="w-full text-xs">
            <SelectValue placeholder={t.componentLibrary.categories.all} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.componentLibrary.categories.all}</SelectItem>
            {componentCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {getTranslatedText(cat.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 标签页 */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ComponentSource)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-3 mt-2 w-auto flex-shrink-0">
          <TabsTrigger value="official" className="flex-1 gap-1 text-xs px-2">
            {t.componentLibrary.tabs?.official || t.componentLibrary.filter.official}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {sourceCounts.official}
            </span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex-1 gap-1 text-xs px-2">
            {t.componentLibrary.tabs?.community || t.componentLibrary.filter.community}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {sourceCounts.community}
            </span>
          </TabsTrigger>
          <TabsTrigger value="local" className="flex-1 gap-1 text-xs px-2">
            {t.componentLibrary.tabs?.local || t.componentLibrary.filter.local}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {sourceCounts.local}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* 官方组件列表 */}
        <TabsContent value="official" className="mt-0 flex-1 overflow-hidden">
          {renderComponentList()}
        </TabsContent>

        {/* 社区组件列表 */}
        <TabsContent value="community" className="mt-0 flex-1 overflow-hidden">
          {renderComponentList()}
        </TabsContent>

        {/* 本地组件列表 */}
        <TabsContent value="local" className="mt-0 flex-1 overflow-hidden">
          {renderComponentList()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
