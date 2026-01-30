/** Link hover preview component */

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { loadPage } from '@/services/pageService';
import { useVaultStore } from '@/stores';
import type { SchemaComponent } from '@/engine-v8/types';

interface LinkPreviewPopoverProps {
  targetPageId: string;
  targetTitle: string;
  displayText: string;
  isValid: boolean;
  onNavigate?: (pageId: string) => void;
  children?: React.ReactNode;
}

/** Extract plain text preview from Schema */
function extractTextPreview(schema: SchemaComponent, maxLength = 200): string {
  let text = '';

  function traverse(node: SchemaComponent | string) {
    if (text.length >= maxLength) return;

    if (typeof node === 'string') {
      text += node.replace(/\[\[.*?\]\]/g, '').trim() + ' ';
      return;
    }

    if (node.data?.content && typeof node.data.content === 'string') {
      text += node.data.content.replace(/\[\[.*?\]\]/g, '').trim() + ' ';
    }

    if (node.children) {
      for (const child of node.children) {
        if (text.length >= maxLength) break;
        traverse(child as SchemaComponent | string);
      }
    }
  }

  traverse(schema);
  return text.trim().slice(0, maxLength) + (text.length > maxLength ? '...' : '');
}

export function LinkPreviewPopover({
  targetPageId,
  targetTitle,
  displayText,
  isValid,
  onNavigate,
}: LinkPreviewPopoverProps) {
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const currentVault = useVaultStore(state => state.currentVault);

  useEffect(() => {
    if (!isOpen || !isValid || !targetPageId || !currentVault) return;

    setIsLoading(true);
    loadPage(currentVault.path, targetPageId)
      .then(pageFile => {
        if (pageFile?.page?.content) {
          setPreview(extractTextPreview(pageFile.page.content));
        }
      })
      .catch(() => setPreview(''))
      .finally(() => setIsLoading(false));
  }, [isOpen, isValid, targetPageId, currentVault]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn(
            'cursor-pointer',
            isValid
              ? 'text-blue-500 hover:text-blue-600 hover:underline'
              : 'text-red-500 opacity-70'
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (targetPageId && onNavigate) {
              onNavigate(targetPageId);
            }
          }}
          onMouseEnter={() => isValid && setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {displayText}
        </span>
      </PopoverTrigger>
      {isValid && (
        <PopoverContent
          className="w-80 p-3"
          side="top"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{targetTitle}</h4>
            <p className="text-xs text-muted-foreground line-clamp-4">
              {isLoading ? 'Loading...' : preview || 'No content'}
            </p>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
