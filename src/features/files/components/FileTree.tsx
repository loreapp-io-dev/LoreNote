/**
 * FileTree - File tree component
 *
 * Features:
 * - Build tree structure from flat folders/pages data
 * - Use @dnd-kit for drag and drop sorting
 * - Recursively render tree nodes, support folder nesting
 * - Blank area context menu for creating files/folders
 *
 * Note: The folder system is pure metadata management, all note files are stored in root directory,
 * folders only organize display structure through parentId field.
 */
import { useMemo, useState, useCallback, useRef } from 'react';
import { FilePlus, FolderPlus, File, Folder } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { FolderReference, PageReference } from '@/types';
import { useVaultStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { FileTreeItem } from './FileTreeItem';
import { InlineCreateItem } from './InlineCreateItem';
import type { NewItemState } from './FileExplorer';

interface FileTreeProps {
  folders: FolderReference[];
  pages: PageReference[];
  newItem: NewItemState | null;
  onCancelCreate: () => void;
  onCreateInFolder: (type: 'folder' | 'page', parentId?: string) => void;
}

/** Tree node structure */
export interface TreeNode {
  id: string;
  type: 'folder' | 'page';
  name: string;
  icon?: string;
  iconType?: 'lucide' | 'emoji';
  parentId?: string;
  sortIndex?: number;
  children: TreeNode[];
  data: FolderReference | PageReference;
}

/** Drop target info */
interface DropTarget {
  type: 'folder' | 'before' | 'after';
  targetId: string;
  parentId?: string;
}

export function FileTree({
  folders,
  pages,
  newItem,
  onCancelCreate,
  onCreateInFolder,
}: FileTreeProps) {
  const { t } = useTranslation();
  const { expandedFolderIds, updatePage, updateFolder, setExpandedFolderIds } = useVaultStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOverIdRef = useRef<string | null>(null);

  // Sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Blank area context menu state
  const [blankAreaMenu, setBlankAreaMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);

  /**
   * Build tree structure
   */
  const treeData = useMemo(() => {
    const folderNodes: Map<string, TreeNode> = new Map();
    const rootNodes: TreeNode[] = [];

    // First create all folder nodes
    folders.forEach((folder) => {
      const node: TreeNode = {
        id: folder.id,
        type: 'folder',
        name: folder.name,
        icon: folder.icon,
        iconType: folder.iconType,
        parentId: folder.parentId,
        sortIndex: folder.sortIndex,
        children: [],
        data: folder,
      };
      folderNodes.set(folder.id, node);
    });

    // Create page nodes and mount to corresponding folders
    pages.forEach((page) => {
      const node: TreeNode = {
        id: page.id,
        type: 'page',
        name: page.title,
        icon: page.icon,
        iconType: page.iconType,
        parentId: page.parentId,
        sortIndex: page.sortIndex,
        children: [],
        data: page,
      };

      if (page.parentId && folderNodes.has(page.parentId)) {
        folderNodes.get(page.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Build folder hierarchy
    folderNodes.forEach((node) => {
      if (node.parentId && folderNodes.has(node.parentId)) {
        folderNodes.get(node.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Recursively sort all nodes
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const aSort = a.sortIndex ?? Infinity;
        const bSort = b.sortIndex ?? Infinity;
        if (aSort !== bSort) return aSort - bSort;
        if (a.type === 'folder' && b.type === 'page') return -1;
        if (a.type === 'page' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((node) => sortNodes(node.children));
    };

    sortNodes(rootNodes);
    return rootNodes;
  }, [folders, pages]);

  // Flatten all node IDs (for SortableContext)
  const flattenedIds = useMemo(() => {
    const ids: string[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        ids.push(node.id);
        if (node.type === 'folder' && expandedFolderIds.includes(node.id)) {
          flatten(node.children);
        }
      });
    };
    flatten(treeData);
    return ids;
  }, [treeData, expandedFolderIds]);

  // Find node
  const findNode = useCallback((id: string): TreeNode | null => {
    const search = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = search(node.children);
        if (found) return found;
      }
      return null;
    };
    return search(treeData);
  }, [treeData]);

  // Check if is descendant
  const isDescendant = useCallback((nodeId: string, ancestorId: string): boolean => {
    let currentId: string | undefined = nodeId;
    while (currentId) {
      if (currentId === ancestorId) return true;
      const folder = folders.find((f) => f.id === currentId);
      currentId = folder?.parentId;
    }
    return false;
  }, [folders]);

  // Drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Drag move - VSCode style: folder three zones (25%/50%/25%), page two zones (50%/50%)
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, over, delta } = event;

    if (!over) {
      setDropTarget(null);
      if (autoExpandTimerRef.current) {
        clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = null;
      }
      lastOverIdRef.current = null;
      return;
    }

    const activeNode = findNode(active.id as string);
    const overNode = findNode(over.id as string);
    if (!activeNode || !overNode || active.id === over.id) {
      setDropTarget(null);
      return;
    }

    // Cannot drag to own child nodes
    if (activeNode.type === 'folder' && isDescendant(over.id as string, active.id as string)) {
      setDropTarget(null);
      return;
    }

    // Calculate current mouse Y position
    const activatorEvent = event.activatorEvent as PointerEvent;
    const currentY = activatorEvent.clientY + delta.y;
    const overRect = over.rect;
    const y = currentY - overRect.top;
    const ratio = y / overRect.height;

    let newDropTarget: DropTarget | null = null;

    if (overNode.type === 'folder') {
      // Folder: top 25%=insert before, middle 50%=drop into, bottom 25%=insert after
      if (ratio < 0.25) {
        newDropTarget = { type: 'before', targetId: over.id as string, parentId: overNode.parentId };
      } else if (ratio > 0.75) {
        newDropTarget = { type: 'after', targetId: over.id as string, parentId: overNode.parentId };
      } else {
        newDropTarget = { type: 'folder', targetId: over.id as string };
      }
    } else {
      // Page: top 50%=insert before, bottom 50%=insert after
      if (ratio < 0.5) {
        newDropTarget = { type: 'before', targetId: over.id as string, parentId: overNode.parentId };
      } else {
        newDropTarget = { type: 'after', targetId: over.id as string, parentId: overNode.parentId };
      }
    }

    setDropTarget(newDropTarget);

    // Auto expand collapsed folders (hover 800ms)
    const overId = over.id as string;
    if (newDropTarget?.type === 'folder' && !expandedFolderIds.includes(overId)) {
      if (lastOverIdRef.current !== overId) {
        if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = setTimeout(() => {
          setExpandedFolderIds([...expandedFolderIds, overId]);
        }, 800);
        lastOverIdRef.current = overId;
      }
    } else {
      if (autoExpandTimerRef.current) {
        clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = null;
      }
      lastOverIdRef.current = null;
    }
  }, [findNode, isDescendant, expandedFolderIds, setExpandedFolderIds]);

  // Drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event;
    const activeNode = findNode(active.id as string);

    if (activeNode && dropTarget) {
      if (dropTarget.type === 'folder') {
        // Drop into folder
        if (!expandedFolderIds.includes(dropTarget.targetId)) {
          setExpandedFolderIds([...expandedFolderIds, dropTarget.targetId]);
        }
        if (activeNode.type === 'page') {
          updatePage(activeNode.id, { parentId: dropTarget.targetId });
        } else {
          updateFolder(activeNode.id, { parentId: dropTarget.targetId });
        }
      } else {
        // Sort (before/after)
        const refNode = findNode(dropTarget.targetId);
        if (refNode) {
          let newSortIndex = 0;
          if (dropTarget.type === 'before') {
            newSortIndex = (refNode.sortIndex ?? 0) - 0.5;
          } else {
            newSortIndex = (refNode.sortIndex ?? 0) + 0.5;
          }

          if (activeNode.type === 'page') {
            updatePage(activeNode.id, { parentId: dropTarget.parentId, sortIndex: newSortIndex });
          } else {
            updateFolder(activeNode.id, { parentId: dropTarget.parentId, sortIndex: newSortIndex });
          }
        }
      }
    }

    setActiveId(null);
    setDropTarget(null);
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
    lastOverIdRef.current = null;
  }, [dropTarget, findNode, expandedFolderIds, setExpandedFolderIds, updatePage, updateFolder]);

  // Get active node
  const activeNode = activeId ? findNode(activeId) : null;

  /** Blank area context menu handler */
  const handleBlankAreaContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-file-tree-item]')) return;
    e.preventDefault();
    setBlankAreaMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  const handleCreatePageFromMenu = useCallback(() => {
    onCreateInFolder('page', undefined);
    setBlankAreaMenu(null);
  }, [onCreateInFolder]);

  const handleCreateFolderFromMenu = useCallback(() => {
    onCreateInFolder('folder', undefined);
    setBlankAreaMenu(null);
  }, [onCreateInFolder]);

  /** Recursively render tree nodes */
  const renderTree = useCallback(
    (nodes: TreeNode[], level = 0, parentId?: string) => {
      const items: React.ReactNode[] = [];

      // Insert new item at current level
      if (newItem && newItem.parentId === parentId) {
        items.push(
          <InlineCreateItem
            key="new-item"
            type={newItem.type}
            level={level}
            parentId={parentId}
            onCancel={onCancelCreate}
          />
        );
      }

      nodes.forEach((node) => {
        const isExpanded = expandedFolderIds.includes(node.id);
        const hasChildren = node.children.length > 0;

        // Calculate drop indicator
        const isOverFolder = dropTarget?.type === 'folder' && dropTarget.targetId === node.id;
        const showInsertBefore = dropTarget?.type === 'before' && dropTarget.targetId === node.id;
        const showInsertAfter = dropTarget?.type === 'after' && dropTarget.targetId === node.id;

        items.push(
          <div key={node.id}>
            <FileTreeItem
              node={node}
              level={level}
              isExpanded={isExpanded}
              onCreateInFolder={onCreateInFolder}
              isOverFolder={isOverFolder}
              showInsertBefore={showInsertBefore}
              showInsertAfter={showInsertAfter}
            />
            {/* Expanded folder shows children */}
            {node.type === 'folder' && isExpanded && (
              <div>
                {renderTree(node.children, level + 1, node.id)}
                {/* Empty folder hint */}
                {!hasChildren && newItem?.parentId !== node.id && (
                  <div
                    className="py-1 text-xs text-neutral-400 dark:text-[#666]"
                    style={{ paddingLeft: 8 + (level + 1) * 16 + 20 }}
                  >
                    {t.files?.emptyFolder || ''}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      });

      return items;
    },
    [expandedFolderIds, newItem, onCancelCreate, onCreateInFolder, t, dropTarget]
  );

  /** Blank area context menu */
  const ContextMenu = () => (
    <>
      <div className="fixed inset-0 z-50" onClick={() => setBlankAreaMenu(null)} />
      <div
        className="fixed z-50 min-w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-[#404040] dark:bg-[#2b2b2b]"
        style={{ left: blankAreaMenu!.x, top: blankAreaMenu!.y }}
      >
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
          onClick={handleCreatePageFromMenu}
        >
          <FilePlus size={14} />
          <span>{t.files?.newPage || ''}</span>
        </button>
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
          onClick={handleCreateFolderFromMenu}
        >
          <FolderPlus size={14} />
          <span>{t.files?.newFolder || ''}</span>
        </button>
      </div>
    </>
  );

  // Empty state
  if (treeData.length === 0 && !newItem) {
    return (
      <div
        ref={containerRef}
        className="flex h-full flex-col items-center justify-center py-8 text-neutral-400 dark:text-[#666]"
        onContextMenu={handleBlankAreaContextMenu}
      >
        <p className="text-sm">{t.files?.noFiles || ''}</p>
        {blankAreaMenu?.visible && <ContextMenu />}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={flattenedIds} strategy={verticalListSortingStrategy}>
        <div
          ref={containerRef}
          className="min-h-full py-1"
          onContextMenu={handleBlankAreaContextMenu}
        >
          {renderTree(treeData, 0, undefined)}
          {blankAreaMenu?.visible && <ContextMenu />}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeNode && (
          <div className="flex items-center gap-1 rounded bg-white px-2 py-1 shadow-lg dark:bg-[#2b2b2b]">
            {activeNode.type === 'folder' ? (
              <Folder size={14} className="text-amber-500" />
            ) : (
              <File size={14} className="text-neutral-400" />
            )}
            <span className="text-sm">{activeNode.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
