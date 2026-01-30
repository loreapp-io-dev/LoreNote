/** 页面预览悬浮框 */

import { useState, useEffect, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { loadPage } from '@/services/pageService';
import { renderSchema } from '@/engine-v8';

interface PagePreviewPopoverProps {
  pageId: string;
  vaultPath: string;
  children: ReactNode;
}

export function PagePreviewPopover({ pageId, vaultPath, children }: PagePreviewPopoverProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    if (!open || !pageId || !vaultPath) return;

    loadPage(vaultPath, pageId).then(pageFile => {
      if (pageFile?.page?.content) {
        const rendered = renderSchema(
          pageFile.page.content,
          pageId,
          vaultPath,
          () => {},
          () => {}
        );
        setContent(rendered);
      }
    });
  }, [open, pageId, vaultPath]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-60 overflow-auto p-3"
        side="left"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="text-sm pointer-events-none">
          {content || <span className="text-muted-foreground">加载中...</span>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
