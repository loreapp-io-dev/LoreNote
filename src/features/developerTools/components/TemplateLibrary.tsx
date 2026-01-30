import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useDeveloperToolsStore } from '../store';
import { componentTemplates } from '../data/templates';
import type { TemplateCategory } from '../types';
import { LocalComponentsManager } from './LocalComponentsManager';

interface TemplateLibraryProps {
  onLoadToEditor?: (schemaJson: string) => void;
}

export function TemplateLibrary({ onLoadToEditor }: TemplateLibraryProps) {
  const { t } = useTranslation();
  const { loadFromTemplate } = useDeveloperToolsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  // 分类列表
  const categories: { id: TemplateCategory | 'all'; name: string }[] = [
    { id: 'all', name: t.componentLibrary.categories.all },
    { id: 'basic', name: t.developerTools.templates.categories.basic },
    { id: 'layout', name: t.developerTools.templates.categories.layout },
    { id: 'interactive', name: t.developerTools.templates.categories.interactive },
    { id: 'advanced', name: t.developerTools.templates.categories.advanced },
    { id: 'data', name: t.developerTools.templates.categories.data },
  ];

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    let templates = componentTemplates;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      templates = templates.filter((t) => t.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  // 按分类分组
  const groupedTemplates = useMemo(() => {
    const groups: Record<TemplateCategory, typeof filteredTemplates> = {
      basic: [],
      layout: [],
      interactive: [],
      advanced: [],
      data: [],
    };

    filteredTemplates.forEach((template) => {
      groups[template.category].push(template);
    });

    return groups;
  }, [filteredTemplates]);

  // 处理模板点击
  const handleTemplateClick = (schemaJson: string) => {
    loadFromTemplate(schemaJson);
    onLoadToEditor?.(schemaJson);
  };

  return (
    <div className="space-y-6">
      {/* 本地组件管理 */}
      <LocalComponentsManager />

      {/* 分隔线 */}
      <div className="border-t border-border" />

      {/* 预置模板 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">{t.developerTools.templates.presetTemplates}</h3>

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
            placeholder={t.developerTools.templates.search}
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

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 模板列表 */}
        {selectedCategory === 'all' ? (
          // 按分类分组显示
          Object.entries(groupedTemplates).map(([category, templates]) => {
            if (templates.length === 0) return null;
            const categoryName = t.developerTools.templates.categories[category as TemplateCategory];
            return (
              <div key={category}>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  {categoryName}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(JSON.stringify(template.schema, null, 2))}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // 单一分类显示
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(JSON.stringify(template.schema, null, 2))}
              />
            ))}
          </div>
        )}

        {/* 无结果提示 */}
        {filteredTemplates.length === 0 && (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            {t.componentLibrary.noResults}
          </div>
        )}
      </div>
    </div>
  );
}

// 模板卡片组件
function TemplateCard({
  template,
  onClick,
}: {
  template: (typeof componentTemplates)[0];
  onClick: () => void;
}) {
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[template.icon] || Icons.Box;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center transition-all hover:border-primary/40 hover:bg-accent/20"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <IconComponent size={16} className="text-muted-foreground" />
      </div>
      <span className="text-xs font-medium text-foreground">{template.name}</span>
    </button>
  );
}
