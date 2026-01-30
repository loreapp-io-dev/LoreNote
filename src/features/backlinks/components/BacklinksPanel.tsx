/** Bidirectional links panel - displays all content mentioning the current page (including [[]] links and plain text) */

import { useEffect, useState } from 'react';
import { ChevronRight, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getBidirectionalLinks,
  type BidirectionalLinkGroup,
} from '@/services/linkService';
import { useTabStore } from '@/stores/tabStore';
import { useVaultStore } from '@/stores/vaultStore';
import { useTranslation } from '@/i18n';
import { PagePreviewPopover } from '@/components/PagePreviewPopover';

interface BacklinksPanelProps {
  pageId: string;
  vaultPath: string;
  pageTitle?: string;
  variant?: 'inline' | 'sidebar';
}

export function BacklinksPanel({
  pageId,
  vaultPath,
  pageTitle,
  variant = 'inline',
}: BacklinksPanelProps) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<BidirectionalLinkGroup[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const pages = useVaultStore(state => state.pages);
  const openTab = useTabStore(state => state.openTab);

  // Get current page title
  const currentPageTitle = pageTitle || pages.find(p => p.id === pageId)?.title || '';

  useEffect(() => {
    if (!pageId || !vaultPath || !currentPageTitle) return;

    setIsLoading(true);
    getBidirectionalLinks(vaultPath, pageId, currentPageTitle, pages)
      .then((data) => {
        setGroups(data);
        // Expand all pages by default
        setExpandedPages(new Set(data.map(g => g.sourcePageId)));
      })
      .finally(() => setIsLoading(false));
  }, [pageId, vaultPath, currentPageTitle, pages]);

  const navigateToPage = (sourcePageId: string, blockId?: string) => {
    const page = pages.find(p => p.id === sourcePageId);
    if (page) {
      openTab(page.id, page.title, page.icon, page.iconType);
      // Delay focus event, wait for page to load
      if (blockId) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockId } }));
        }, 100);
      }
    }
  };

  const togglePage = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const totalMentions = groups.reduce((sum, g) => sum + g.mentions.length, 0);

  if (isLoading) {
    return (
      <div className={cn(
        variant === 'inline' && 'mt-8 pt-4 border-t border-border',
        variant === 'sidebar' && 'p-4'
      )}>
        <div className="text-sm text-muted-foreground">
          {t.common?.loading || '加载中...'}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      variant === 'inline' && 'mt-8 pt-4 border-t border-border',
      variant === 'sidebar' && 'p-4'
    )}>
      {/* Title bar */}
      <div
        className="flex items-center gap-2 mb-2 text-sm text-muted-foreground cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronRight
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
        <Link2 className="w-4 h-4" />
        <span>{t.editor?.bidirectionalLinks || '双向链接'}</span>
        <span className="text-xs">({totalMentions})</span>
      </div>

      {/* Grouped list */}
      {isExpanded && groups.length > 0 && (
        <div className="space-y-1 pl-2">
          {groups.map((group) => (
            <div key={group.sourcePageId}>
              {/* Page title row */}
              <div
                className="flex items-center gap-1 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
                onClick={() => togglePage(group.sourcePageId)}
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 text-muted-foreground transition-transform shrink-0',
                    expandedPages.has(group.sourcePageId) && 'rotate-90'
                  )}
                />
                <span
                  className="text-sm text-blue-500 hover:text-blue-600 hover:underline truncate flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToPage(group.sourcePageId);
                  }}
                >
                  {group.sourcePageTitle}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({group.mentions.length})
                </span>
              </div>

              {/* Mentions list */}
              {expandedPages.has(group.sourcePageId) && (
                <div className="pl-4 space-y-1">
                  {group.mentions.map((mention, idx) => (
                    <PagePreviewPopover
                      key={`${mention.sourceBlockId || idx}`}
                      pageId={group.sourcePageId}
                      vaultPath={vaultPath}
                    >
                      <div
                        className="py-1 border-l-2 border-muted pl-2 cursor-pointer hover:border-blue-500 hover:bg-muted/30"
                        onClick={() => navigateToPage(group.sourcePageId, mention.sourceBlockId)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {mention.sourceBlockPreview ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {mention.sourceBlockPreview}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                {t.editor?.noPreview || '(无预览)'}
                              </p>
                            )}
                          </div>
                          <span className={cn(
                            'shrink-0 text-[10px] px-1.5 py-0.5 rounded',
                            mention.type === 'link'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          )}>
                            {mention.type === 'link'
                              ? (t.editor?.linkType || '双链')
                              : (t.editor?.textType || '文本')}
                          </span>
                        </div>
                      </div>
                    </PagePreviewPopover>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isExpanded && groups.length === 0 && (
        <div className="text-sm text-muted-foreground pl-6">
          {t.editor?.noBidirectionalLinks || '暂无双向链接'}
        </div>
      )}
    </div>
  );
}
