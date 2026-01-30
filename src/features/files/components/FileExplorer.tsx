/**
 * FileExplorer - File explorer component
 *
 * Features:
 * - Display current vault's file tree
 * - Toolbar: new page, new folder, expand/collapse all
 * - Support drag and drop sorting
 */
import { useState } from 'react';
import { FolderPlus, FilePlus, ChevronsUpDown } from 'lucide-react';
import { useVaultStore, useUIStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { FileTree } from './FileTree';

interface FileExplorerProps {
  titleBarHeight?: number;
}

/** New item state */
export interface NewItemState {
  type: 'folder' | 'page';
  parentId?: string;
}

export function FileExplorer({ titleBarHeight = 44 }: FileExplorerProps) {
  const { t } = useTranslation();
  const { currentVault, pages, folders, setExpandedFolderIds } = useVaultStore();
  const { secondaryPanelWidth } = useUIStore();

  // New item state
  const [newItem, setNewItem] = useState<NewItemState | null>(null);
  // All expanded state
  const [allExpanded, setAllExpanded] = useState(true);

  /** Create folder (root directory) */
  const handleCreateFolder = () => {
    setNewItem({ type: 'folder', parentId: undefined });
  };

  /** Create page (root directory) */
  const handleCreatePage = () => {
    setNewItem({ type: 'page', parentId: undefined });
  };

  /** Cancel create */
  const handleCancelCreate = () => {
    setNewItem(null);
  };

  /** Create in specified folder */
  const handleCreateInFolder = (type: 'folder' | 'page', parentId?: string) => {
    setNewItem({ type, parentId });
  };

  /** Expand/collapse all folders */
  const handleToggleExpand = () => {
    if (allExpanded) {
      setExpandedFolderIds([]);
      setAllExpanded(false);
    } else {
      const allFolderIds = folders.map(f => f.id);
      setExpandedFolderIds(allFolderIds);
      setAllExpanded(true);
    }
  };

  if (!currentVault) {
    return null;
  }

  return (
    <div
      className="flex flex-col border-r border-neutral-200 bg-neutral-50 dark:border-[#333] dark:bg-[#252525]"
      style={{
        width: secondaryPanelWidth,
        height: `calc(100vh - ${titleBarHeight}px)`,
      }}
    >
      {/* Toolbar */}
      <div className="flex h-10 items-center justify-center gap-1 border-b border-neutral-200 px-3 dark:border-[#333]">
        <button
          onClick={handleCreatePage}
          className="flex items-center justify-center rounded p-1.5 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:text-[#aaa] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]"
          title={t.files?.newPage || ''}
        >
          <FilePlus size={18} />
        </button>
        <button
          onClick={handleCreateFolder}
          className="flex items-center justify-center rounded p-1.5 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:text-[#aaa] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]"
          title={t.files?.newFolder || ''}
        >
          <FolderPlus size={18} />
        </button>
        <button
          onClick={handleToggleExpand}
          className="flex items-center justify-center rounded p-1.5 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:text-[#aaa] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]"
          title={allExpanded ? t.files?.collapseAll || '' : t.files?.expandAll || ''}
        >
          <ChevronsUpDown size={18} />
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree
          folders={folders}
          pages={pages}
          newItem={newItem}
          onCancelCreate={handleCancelCreate}
          onCreateInFolder={handleCreateInFolder}
        />
      </div>
    </div>
  );
}
