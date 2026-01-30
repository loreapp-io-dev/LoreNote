/** TabEditor V8 - Using V8 engine */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useVaultStore, useTabStore } from '@/stores';
import { DataEngine, renderSchema } from '@/engine-v8';
import { EditorSkeleton } from './EditorSkeleton';
import { HOME_PAGE_ID } from '@/stores';
import { loadPage, savePage } from '@/services/pageService';
import type { SchemaComponent } from '@/engine-v8/types';
import { BlockWrapper } from '@/components/BlockWrapper';
import { InlineSlashInput } from '@/components/InlineSlashInput';
import { generateId } from '@/utils/uuid';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

interface TabEditorV8Props {
  tabId: string;
  pageId: string;
}

export function TabEditorV8({ pageId }: TabEditorV8Props) {
  const currentVault = useVaultStore((state) => state.currentVault);
  const pages = useVaultStore((state) => state.pages);
  const openTab = useTabStore((state) => state.openTab);
  const [schema, setSchema] = useState<SchemaComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Configure drag sensors, add activation distance to avoid accidental triggers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Get all block IDs list
  const blockIds = useMemo(() => {
    if (!schema?.children) return [];
    return schema.children
      .filter((child): child is SchemaComponent => typeof child !== 'string')
      .map((child, index) => child.id || `block-${index}`);
  }, [schema?.children]);

  // Update schema state (read latest value from cache)
  const handleUpdate = useCallback(() => {
    if (currentVault?.path) {
      const latest = DataEngine.readPage(pageId, currentVault.path);
      if (latest) {
        setSchema(latest);
      }
    }
  }, [pageId, currentVault?.path]);

  // Save to file
  const handleSave = useCallback((schemaData: SchemaComponent) => {
    if (!currentVault?.path) return;
    savePage(currentVault.path, pageId, schemaData as any, { pages }).catch(console.error);
  }, [currentVault?.path, pageId, pages]);

  // Add new component at specified position
  const handleAddBlock = useCallback((index: number) => {
    if (!currentVault?.path) return;
    setInsertIndex(index + 1);
  }, [currentVault?.path]);

  // Close insert input
  const handleCloseInsert = useCallback(() => {
    setInsertIndex(null);
    setSelectedBlockIndex(null);
  }, []);

  // Delete component
  const handleDeleteBlock = useCallback((index: number) => {
    if (!currentVault?.path || !schema) return;
    if (schema.children) {
      const updatedSchema = {
        ...schema,
        children: schema.children.filter((_, i) => i !== index),
      };
      DataEngine.setPage(pageId, currentVault.path, updatedSchema);
      handleSave(updatedSchema);
      setSchema(updatedSchema);
    }
  }, [pageId, currentVault?.path, schema, handleSave]);

  // Edit component (set isEditing = true)
  const handleEditBlock = useCallback((index: number) => {
    if (!currentVault?.path || !schema) return;
    const child = schema.children?.[index];
    if (typeof child === 'string' || !child) return;

    const updatedChild = {
      ...child,
      data: { ...child.data, isEditing: true },
    };
    const updatedChildren = [...(schema.children || [])];
    updatedChildren[index] = updatedChild;

    const updatedSchema = { ...schema, children: updatedChildren };
    DataEngine.setPage(pageId, currentVault.path, updatedSchema);
    handleSave(updatedSchema);
    setSchema(updatedSchema);
  }, [pageId, currentVault?.path, schema, handleSave]);

  // Copy component
  const handleCopyBlock = useCallback((index: number) => {
    if (!currentVault?.path || !schema) return;
    const child = schema.children?.[index];
    if (typeof child === 'string' || !child) return;

    const cloned = JSON.parse(JSON.stringify(child)) as SchemaComponent;
    cloned.id = generateId();

    const updatedChildren = [...(schema.children || [])];
    updatedChildren.splice(index + 1, 0, cloned);

    const updatedSchema = { ...schema, children: updatedChildren };
    DataEngine.setPage(pageId, currentVault.path, updatedSchema);
    handleSave(updatedSchema);
    setSchema(updatedSchema);
  }, [pageId, currentVault?.path, schema, handleSave]);

  // @dnd-kit drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!currentVault?.path || !schema?.children) return;

    const oldIndex = blockIds.indexOf(active.id as string);
    const newIndex = blockIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newChildren = arrayMove([...schema.children], oldIndex, newIndex);
    const updatedSchema = { ...schema, children: newChildren };
    DataEngine.setPage(pageId, currentVault.path, updatedSchema);
    handleSave(updatedSchema);
    setSchema(updatedSchema);
  }, [blockIds, pageId, currentVault?.path, schema, handleSave]);

  // Handle keyboard events in editor
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (insertIndex !== null) return;

    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT';
    const isContentEditable = target.getAttribute('contenteditable') === 'true';

    if (!isInput && !isContentEditable) return;

    const blockWrapper = target.closest('[data-block-index]');
    if (!blockWrapper) return;
    const blockIndex = parseInt(blockWrapper.getAttribute('data-block-index') || '0', 10);

    const content = isInput ? (target as HTMLInputElement).value : target.innerText;
    const isEmpty = content.trim() === '';

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isEmpty) {
        if (currentVault?.path) {
          const latest = DataEngine.readPage(pageId, currentVault.path);
          if (latest) setSchema(latest);
        }
        setInsertIndex(blockIndex + 1);
      }
      return;
    }

    if (e.key === 'Backspace' && isEmpty) {
      e.preventDefault();
      handleDeleteBlock(blockIndex);
      if (blockIndex > 0) {
        window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: blockIndex - 1 } }));
      } else if (schema?.children && schema.children.length > 1) {
        window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: 0 } }));
      }
      return;
    }

    if (e.key === 'ArrowUp' && blockIndex > 0) {
      e.preventDefault();
      if (schema) handleSave(schema);
      for (let i = blockIndex - 1; i >= 0; i--) {
        const child = schema?.children?.[i];
        if (typeof child !== 'string' && child?.props?.contentEditable === true) {
          window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: i } }));
          break;
        }
      }
    } else if (e.key === 'ArrowDown' && schema?.children && blockIndex < schema.children.length - 1) {
      e.preventDefault();
      handleSave(schema);
      for (let i = blockIndex + 1; i < schema.children.length; i++) {
        const child = schema.children[i];
        if (typeof child !== 'string' && child?.props?.contentEditable === true) {
          window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: i } }));
          break;
        }
      }
    }
  }, [insertIndex, handleDeleteBlock, schema, handleSave, currentVault?.path, pageId]);

  // Wiki link navigation
  const handleWikiLinkNavigate = useCallback((targetPageId: string) => {
    const targetPage = pages.find(p => p.id === targetPageId);
    if (targetPage) {
      openTab(targetPageId, targetPage.title, targetPage.icon, targetPage.iconType);
    }
  }, [pages, openTab]);

  // Click blank area to open slash command
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    if (!currentVault?.path || !editorRef.current || !schema) return;

    const target = e.target as HTMLElement;

    // Handle Wiki link click navigation
    const wikiLink = target.closest('[data-wiki-link]') as HTMLElement;
    if (wikiLink) {
      const targetPageId = wikiLink.getAttribute('data-wiki-link');
      if (targetPageId) {
        handleWikiLinkNavigate(targetPageId);
        return;
      }
    }

    // Handle NoteLink click navigation
    const noteLink = target.closest('[data-link-type="note"]') as HTMLElement;
    if (noteLink) {
      const targetPageId = noteLink.getAttribute('data-target');
      if (targetPageId) {
        const targetPage = pages.find(p => p.id === targetPageId);
        openTab(targetPageId, targetPage?.title || targetPageId, targetPage?.icon, targetPage?.iconType);
        return;
      }
    }

    // Save current page state first (ensure content being edited is not lost)
    const latestSchema = DataEngine.readPage(pageId, currentVault.path);
    if (latestSchema) {
      handleSave(latestSchema);
      setSchema(latestSchema);
    }

    const emptyBlock = target.closest('[data-block-type="empty"]');
    if (emptyBlock) {
      const blockWrapper = emptyBlock.closest('[data-block-index]');
      if (blockWrapper) {
        const index = parseInt(blockWrapper.getAttribute('data-block-index') || '0', 10);
        if (schema.children) {
          const updatedSchema = {
            ...schema,
            children: schema.children.filter((_, i) => i !== index),
          };
          DataEngine.setPage(pageId, currentVault.path, updatedSchema);
          handleSave(updatedSchema);
          setSchema(updatedSchema);
        }
        setInsertIndex(index);
        return;
      }
    }

    const isEditorContainer = target === editorRef.current;
    const isBlankArea = target.hasAttribute('data-editor-blank');

    if (insertIndex !== null) {
      setInsertIndex(null);
      if (!isEditorContainer && !isBlankArea) return;
    }

    if (!isEditorContainer && !isBlankArea) return;

    const blocks = editorRef.current.querySelectorAll('[data-block-index]');
    const lastIndex = blocks.length > 0 ? blocks.length : 0;
    setInsertIndex(lastIndex);
  }, [currentVault?.path, pageId, schema, insertIndex, handleSave, pages, openTab, handleWikiLinkNavigate]);

  // Listen for page update events
  useEffect(() => {
    const handlePageUpdate = (e: CustomEvent) => {
      if (e.detail.pageId === pageId) handleUpdate();
    };
    window.addEventListener('page-updated', handlePageUpdate as EventListener);
    return () => window.removeEventListener('page-updated', handlePageUpdate as EventListener);
  }, [pageId, handleUpdate]);

  // Listen for focus block events
  useEffect(() => {
    const handleFocusBlock = (e: CustomEvent) => {
      const { blockIndex } = e.detail;
      requestAnimationFrame(() => {
        if (!editorRef.current || !currentVault?.path) return;

        const latestSchema = DataEngine.readPage(pageId, currentVault.path);
        if (!latestSchema?.children) return;

        const blockWrapper = editorRef.current.querySelector(`[data-block-index="${blockIndex}"]`);
        if (!blockWrapper) return;

        const emptyBlock = blockWrapper.querySelector('[data-block-type="empty"]');
        if (emptyBlock) {
          const updatedSchema = {
            ...latestSchema,
            children: latestSchema.children.filter((_, i) => i !== blockIndex),
          };
          DataEngine.setPage(pageId, currentVault.path, updatedSchema);
          savePage(currentVault.path, pageId, updatedSchema as any, { pages }).catch(console.error);
          setSchema(updatedSchema);
          setInsertIndex(blockIndex);
          return;
        }

        const editable = blockWrapper.querySelector('[contenteditable="true"], input:not([type="checkbox"]):not([type="radio"])') as HTMLElement;
        if (editable) {
          editable.focus();
          if (editable.getAttribute('contenteditable') === 'true') {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editable);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          } else {
            const input = editable as HTMLInputElement;
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
      });
    };

    window.addEventListener('focus-block', handleFocusBlock as EventListener);
    return () => window.removeEventListener('focus-block', handleFocusBlock as EventListener);
  }, [pageId, currentVault?.path]);

  // Load page data
  useEffect(() => {
    if (pageId === HOME_PAGE_ID || !currentVault?.path) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadPage(currentVault.path, pageId)
      .then((pageFile) => {
        if (pageFile) {
          const content = pageFile.page.content as unknown as SchemaComponent;
          DataEngine.setPage(pageId, currentVault.path, content);
          setSchema(content);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [pageId, currentVault?.path]);

  // Save on component unmount
  useEffect(() => {
    return () => DataEngine.flushPendingWrites(pageId);
  }, [pageId]);

  if (pageId === HOME_PAGE_ID) {
    return <div className="p-4">Home Page</div>;
  }

  if (!currentVault?.path) {
    return <div className="p-4 text-destructive">No vault open</div>;
  }

  if (isLoading) {
    return <EditorSkeleton />;
  }

  if (!schema) {
    return <div className="p-4 text-muted-foreground">Empty page</div>;
  }

  return (
    <div
      ref={editorRef}
      className="h-full min-h-full overflow-y-auto scrollbar-hide"
      onClick={handleEditorClick}
      onKeyDown={handleEditorKeyDown}
      data-page-id={pageId}
      data-vault-path={currentVault.path}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {schema.children?.map((child, index) => {
            if (typeof child === 'string') return null;
            const blockId = child.id || `block-${index}`;

            return (
              <div key={blockId}>
                <div data-block-index={index}>
                  <BlockWrapper
                    blockId={blockId}
                    index={index}
                    schema={child}
                    onAdd={handleAddBlock}
                    onEdit={handleEditBlock}
                    onDelete={handleDeleteBlock}
                    onCopy={handleCopyBlock}
                    isSelected={selectedBlockIndex === index}
                  >
                    {renderSchema(
                      { ...child, data: { ...child.data, $pages: pages.filter(p => p.id !== pageId) } },
                      pageId, currentVault.path, handleUpdate, handleSave, pages, handleWikiLinkNavigate
                    )}
                  </BlockWrapper>
                </div>
                {insertIndex === index + 1 && (
                  <InlineSlashInput
                    pageId={pageId}
                    vaultPath={currentVault.path}
                    insertIndex={insertIndex}
                    onClose={handleCloseInsert}
                    onInserted={handleUpdate}
                    onOpenNextInput={setInsertIndex}
                    onSelectBlock={setSelectedBlockIndex}
                    selectedBlockIndex={selectedBlockIndex}
                  />
                )}
              </div>
            );
          })}
        </SortableContext>
      </DndContext>
      {insertIndex === 0 && (
        <InlineSlashInput
          pageId={pageId}
          vaultPath={currentVault.path}
          insertIndex={0}
          onClose={handleCloseInsert}
          onInserted={handleUpdate}
          onOpenNextInput={setInsertIndex}
          onSelectBlock={setSelectedBlockIndex}
          selectedBlockIndex={selectedBlockIndex}
        />
      )}
      <div className="h-64 w-full" data-editor-blank />
    </div>
  );
}
