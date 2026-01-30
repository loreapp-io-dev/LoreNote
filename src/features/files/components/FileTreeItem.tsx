/**
 * FileTreeItem - File tree single node component
 *
 * Features:
 * - Display folder or page node
 * - Support click to expand/collapse folder, open page
 * - Context menu: rename, delete, create in folder
 * - Inline rename editing
 * - Custom icon display (emoji or lucide icon)
 * - Use @dnd-kit for drag and drop sorting
 */
import { useState, useRef } from 'react';
import {
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  FilePlus,
  FolderPlus,
  FolderInput,
  Check,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { useVaultStore, useTabStore, useActivePageId } from '@/stores';
import { useTranslation } from '@/i18n';
import type { TreeNode } from './FileTree';
import { renderItemIcon } from '../utils/iconUtils';

interface FileTreeItemProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  onCreateInFolder: (type: 'folder' | 'page', parentId: string) => void;
  isOverFolder?: boolean;
  showInsertBefore?: boolean;
  showInsertAfter?: boolean;
}

export function FileTreeItem({
  node,
  level,
  isExpanded,
  onCreateInFolder,
  isOverFolder = false,
  showInsertBefore = false,
  showInsertAfter = false,
}: FileTreeItemProps) {
  const { t } = useTranslation();
  const {
    toggleFolderExpand,
    updateFolder,
    updatePage,
    setExpandedFolderIds,
    expandedFolderIds,
    folders,
    pages,
    selectedFolderId,
    setSelectedFolderId,
    movePageToTrash,
    moveFolderToTrash,
  } = useVaultStore();
  const openTab = useTabStore((state) => state.openTab);
  const activePageId = useActivePageId();

  // @dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  // Context menu state
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Check if folder name exists in same directory (excluding self) */
  const checkFolderNameExists = (folderName: string): boolean => {
    return folders.some(
      (f) =>
        f.id !== node.id &&
        f.parentId === node.parentId &&
        f.name.toLowerCase() === folderName.toLowerCase()
    );
  };

  /** Check if page name exists in same directory (excluding self) */
  const checkPageNameExists = (pageName: string): boolean => {
    return pages.some(
      (p) =>
        p.id !== node.id &&
        p.parentId === node.parentId &&
        p.title.toLowerCase() === pageName.toLowerCase()
    );
  };

  // Check if current node is selected
  const isPageSelected = node.type === 'page' && activePageId === node.id;
  const isFolderSelected = node.type === 'folder' && selectedFolderId === node.id;
  const isSelected = isPageSelected || isFolderSelected;

  // Calculate indentation
  const paddingLeft = 8 + level * 16;

  /** Click node: folder expand/collapse and select, page opens tab */
  const handleClick = () => {
    if (node.type === 'folder') {
      setSelectedFolderId(node.id);
      toggleFolderExpand(node.id);
    } else {
      setSelectedFolderId(null);
      openTab(node.id, node.name, node.icon, node.iconType);
    }
  };

  /** Context menu */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  /** Start rename */
  const handleRename = () => {
    setShowContextMenu(false);
    setIsRenaming(true);
    setRenameValue(node.name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  /** Submit rename */
  const handleRenameSubmit = () => {
    const trimmedName = renameValue.trim();
    if (trimmedName && trimmedName !== node.name) {
      // Check folder name duplicate
      if (node.type === 'folder' && checkFolderNameExists(trimmedName)) {
        setRenameError(t.files?.folderNameExists || '');
        inputRef.current?.focus();
        return;
      }
      // Check page name duplicate
      if (node.type === 'page' && checkPageNameExists(trimmedName)) {
        setRenameError(t.files?.pageNameExists || '');
        inputRef.current?.focus();
        return;
      }
      if (node.type === 'folder') {
        updateFolder(node.id, { name: trimmedName });
      } else {
        updatePage(node.id, { title: trimmedName });
      }
    }
    setIsRenaming(false);
    setRenameError(null);
  };

  /** Delete node (move to trash) */
  const handleDelete = async () => {
    setShowContextMenu(false);
    if (node.type === 'folder') {
      await moveFolderToTrash(node.id);
    } else {
      await movePageToTrash(node.id);
    }
  };

  /** Create page in folder */
  const handleCreatePageInFolder = () => {
    setShowContextMenu(false);
    // Ensure folder is expanded to show new item
    if (!expandedFolderIds.includes(node.id)) {
      setExpandedFolderIds([...expandedFolderIds, node.id]);
    }
    onCreateInFolder('page', node.id);
  };

  /** Create subfolder in folder */
  const handleCreateFolderInFolder = () => {
    setShowContextMenu(false);
    if (!expandedFolderIds.includes(node.id)) {
      setExpandedFolderIds([...expandedFolderIds, node.id]);
    }
    onCreateInFolder('folder', node.id);
  };

  /** Move page to specified folder */
  const handleMoveTo = (targetFolderId: string | undefined) => {
    if (node.type === 'page') {
      updatePage(node.id, { parentId: targetFolderId });
    }
    setShowContextMenu(false);
    setShowMoveSubmenu(false);
  };

  /** Get default icon */
  const getDefaultIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? (
        <FolderOpen size={16} className="text-amber-500" />
      ) : (
        <Folder size={16} className="text-amber-500" />
      );
    }
    return <File size={16} className="text-neutral-400 dark:text-[#888]" />;
  };

  return (
    <>
      {/* Insert indicator line - before node */}
      {showInsertBefore && (
        <div
          className="pointer-events-none h-px border-b border-dashed border-muted-foreground/50"
          style={{ marginLeft: paddingLeft }}
        />
      )}
      <div
        ref={setNodeRef}
        style={style}
        data-file-tree-item
        className={`
          group flex cursor-pointer items-center gap-1 py-1 pr-2 transition-colors
          ${
            isOverFolder
              ? 'bg-neutral-200 dark:bg-[#404040]'
              : isSelected
                ? 'bg-[#7f6df2]/10 text-[#7f6df2]'
                : 'text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]'
          }
          ${isDragging ? 'opacity-50' : ''}
        `}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Drag handle area */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center touch-none"
          style={{ paddingLeft }}
        >
          {/* Expand/collapse arrow */}
          <div className="flex h-4 w-4 items-center justify-center">
            {node.type === 'folder' && (
              <ChevronRight
                size={14}
                className={`text-neutral-400 transition-transform dark:text-[#666] ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            )}
          </div>

          {/* Icon */}
          <div className="flex h-4 w-4 items-center justify-center">
            {node.icon ? renderItemIcon(node.icon, node.iconType) : getDefaultIcon()}
          </div>
        </div>

        {/* Name (supports inline editing) */}
        {isRenaming ? (
          <div className="flex flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => {
                setRenameValue(e.target.value);
                setRenameError(null);
              }}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') {
                  setIsRenaming(false);
                  setRenameError(null);
                }
              }}
              className={`flex-1 rounded border bg-white px-1 text-sm outline-none dark:bg-[#2b2b2b] ${
                renameError ? 'border-red-500' : 'border-[#7f6df2]'
              }`}
            />
            {renameError && (
              <span className="mt-0.5 text-xs text-red-500">{renameError}</span>
            )}
          </div>
        ) : (
          <span className="flex-1 truncate text-sm">{node.name}</span>
        )}

        {/* More button */}
        <button
          className="invisible rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 group-hover:visible dark:text-[#666] dark:hover:bg-[#404040] dark:hover:text-[#888]"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e);
          }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
      {/* Insert indicator line - after node */}
      {showInsertAfter && (
        <div
          className="pointer-events-none h-px border-b border-dashed border-muted-foreground/50"
          style={{ marginLeft: paddingLeft }}
        />
      )}

      {/* Context menu */}
      {showContextMenu && (
        <>
          {/* Click overlay to close menu */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed z-50 min-w-[160px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-[#404040] dark:bg-[#2b2b2b]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            {/* Folder-specific create options */}
            {node.type === 'folder' && (
              <>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
                  onClick={handleCreatePageInFolder}
                >
                  <FilePlus size={14} />
                  <span>{t.files?.newPage || ''}</span>
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
                  onClick={handleCreateFolderInFolder}
                >
                  <FolderPlus size={14} />
                  <span>{t.files?.newFolder || ''}</span>
                </button>
                <div className="my-1 border-t border-neutral-200 dark:border-[#404040]" />
              </>
            )}
            {/* Page-specific move to option */}
            {node.type === 'page' && (
              <>
                <div
                  className="relative flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
                  onMouseEnter={() => setShowMoveSubmenu(true)}
                  onMouseLeave={() => setShowMoveSubmenu(false)}
                >
                  <div className="flex items-center gap-2">
                    <FolderInput size={14} />
                    <span>{t.files?.moveTo || ''}</span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />

                  {/* Move to submenu */}
                  {showMoveSubmenu && (
                    <div
                      className="absolute left-full top-0 z-50 ml-1 min-w-[140px] max-h-[200px] overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-[#404040] dark:bg-[#2b2b2b]"
                    >
                      {/* Root directory option */}
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
                        onClick={() => handleMoveTo(undefined)}
                      >
                        <Folder size={14} className="text-amber-500" />
                        <span>{t.files?.rootFolder || ''}</span>
                        {!node.parentId && (
                          <Check size={14} className="ml-auto text-[#7f6df2]" />
                        )}
                      </button>
                      {folders.length > 0 && (
                        <div className="my-1 border-t border-neutral-200 dark:border-[#404040]" />
                      )}
                      {/* Folder list */}
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
                          onClick={() => handleMoveTo(folder.id)}
                        >
                          <Folder size={14} className="text-amber-500" />
                          <span className="truncate">{folder.name}</span>
                          {node.parentId === folder.id && (
                            <Check size={14} className="ml-auto flex-shrink-0 text-[#7f6df2]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="my-1 border-t border-neutral-200 dark:border-[#404040]" />
              </>
            )}
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-[#dcddde] dark:hover:bg-[#383838]"
              onClick={handleRename}
            >
              <Pencil size={14} />
              <span>{t.common?.rename || ''}</span>
            </button>
            <div className="my-1 border-t border-neutral-200 dark:border-[#404040]" />
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
              <span>{t.common?.delete || ''}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
