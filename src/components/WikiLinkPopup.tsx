/** Wiki 链接弹窗 - 页面搜索和选择 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { FileText, Plus } from 'lucide-react';
import { searchPages } from '@/services/wikiLinkService';
import { useTranslation } from '@/i18n';
import { useVaultStore } from '@/stores/vaultStore';
import type { PageReference } from '@/types';

interface WikiLinkPopupProps {
  searchQuery: string;
  pages: PageReference[];
  onSelect: (page: PageReference) => void;
  onCreateNew?: (title: string) => void;
  onClose: () => void;
}

export function WikiLinkPopup({
  searchQuery,
  pages,
  onSelect,
  onCreateNew,
  onClose,
}: WikiLinkPopupProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const folders = useVaultStore(state => state.folders);

  // 构建文件夹路径映射
  const folderPathMap = useMemo(() => {
    const map = new Map<string, string>();
    const getPath = (folderId: string, visited = new Set<string>()): string => {
      if (map.has(folderId)) return map.get(folderId)!;
      if (visited.has(folderId)) return ''; // 防止循环引用
      visited.add(folderId);
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return '';
      if (!folder.parentId) {
        map.set(folderId, folder.name);
        return folder.name;
      }
      const parentPath = getPath(folder.parentId, visited);
      const path = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
      map.set(folderId, path);
      return path;
    };
    folders.forEach(f => getPath(f.id));
    return map;
  }, [folders]);

  // 搜索匹配的页面
  const filteredPages = useMemo(
    () => searchPages(pages, searchQuery, 8),
    [pages, searchQuery]
  );

  // 检查是否有精确匹配
  const hasExactMatch = useMemo(
    () =>
      searchQuery &&
      filteredPages.some(
        p => p.title.toLowerCase() === searchQuery.toLowerCase()
      ),
    [filteredPages, searchQuery]
  );

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = filteredPages.length + (searchQuery && !hasExactMatch && onCreateNew ? 1 : 0);
      if (totalItems === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(i => Math.min(i + 1, totalItems - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (selectedIndex < filteredPages.length) {
            onSelect(filteredPages[selectedIndex]);
          } else if (onCreateNew && searchQuery) {
            onCreateNew(searchQuery);
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPages, selectedIndex, searchQuery, hasExactMatch, onSelect, onCreateNew, onClose]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 渲染页面图标
  const renderIcon = (page: PageReference) => {
    if (page.icon) {
      if (page.iconType === 'emoji') {
        return <span className="text-sm">{page.icon}</span>;
      }
      // Lucide 图标 - 简化处理，显示为 FileText
      return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div
      ref={containerRef}
      className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[240px] max-w-[360px]"
    >
      {/* 页面列表 */}
      {filteredPages.length > 0 && (
        <div className="py-1">
          {filteredPages.map((page, index) => {
            const folderPath = page.parentId ? folderPathMap.get(page.parentId) : null;
            return (
              <div
                key={page.id}
                className={`px-3 py-1.5 cursor-pointer ${
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(page);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">
                    {renderIcon(page)}
                  </span>
                  <span className="truncate text-sm">{page.title}</span>
                  {folderPath && (
                    <span className="text-xs truncate shrink-0 flex items-center gap-0.5">
                      {folderPath.split(' / ').map((part, i, arr) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-muted-foreground/50">/</span>}
                          <span className={i === arr.length - 1 ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
                            {part}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 创建新页面选项 */}
      {searchQuery && !hasExactMatch && onCreateNew && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-t border-border ${
            selectedIndex === filteredPages.length
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-muted'
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCreateNew(searchQuery);
          }}
          onMouseEnter={() => setSelectedIndex(filteredPages.length)}
        >
          <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm">
            {t.editor?.createPage || '创建'} "{searchQuery}"
          </span>
        </div>
      )}

      {/* 空状态 */}
      {filteredPages.length === 0 && !searchQuery && (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          {t.editor?.noPages || '暂无页面'}
        </div>
      )}
    </div>
  );
}
