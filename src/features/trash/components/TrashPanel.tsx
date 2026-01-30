/**
 * TrashPanel - Trash panel component
 *
 * Features:
 * - Display deleted pages and folders list
 * - Support restore and permanent delete
 * - Support empty trash
 */
import { useState } from 'react';
import { Trash2, RotateCcw, XCircle, Folder, FileText, AlertTriangle } from 'lucide-react';
import { useVaultStore, useUIStore } from '@/stores';
import { useTranslation } from '@/i18n';
import type { TrashItem, PageReference, FolderReference } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrashPanelProps {
  titleBarHeight?: number;
}

export function TrashPanel({ titleBarHeight = 44 }: TrashPanelProps) {
  const { t } = useTranslation();
  const { trashItems, restoreFromTrash, permanentlyDeleteTrashItem, emptyTrash } = useVaultStore();
  const { secondaryPanelWidth } = useUIStore();

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrashItem | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  /** Format deleted time */
  const formatDeletedTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t.relativeTime.justNow;
    } else if (diffMins < 60) {
      return t.relativeTime.minutesAgo.replace('{count}', String(diffMins));
    } else if (diffHours < 24) {
      return t.relativeTime.hoursAgo.replace('{count}', String(diffHours));
    } else {
      return t.relativeTime.daysAgo.replace('{count}', String(diffDays));
    }
  };

  /** Get item name */
  const getItemName = (item: TrashItem) => {
    if (item.type === 'page') {
      return (item.originalData as PageReference).title || t.common.untitled;
    }
    return (item.originalData as FolderReference).name;
  };

  /** Handle restore */
  const handleRestore = async (item: TrashItem) => {
    await restoreFromTrash(item.id);
  };

  /** Handle permanent delete */
  const handlePermanentDelete = async () => {
    if (deleteConfirmItem) {
      await permanentlyDeleteTrashItem(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    }
  };

  /** Handle empty trash */
  const handleEmptyTrash = async () => {
    await emptyTrash();
    setShowEmptyConfirm(false);
  };

  // Sort by deleted time (newest first)
  const sortedItems = [...trashItems].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );

  return (
    <div
      className="flex flex-col border-r border-neutral-200 bg-neutral-50 dark:border-[#333] dark:bg-[#252525]"
      style={{
        width: secondaryPanelWidth,
        height: `calc(100vh - ${titleBarHeight}px)`,
      }}
    >
      {/* Title bar */}
      <div className="flex h-10 items-center justify-between border-b border-neutral-200 px-3 dark:border-[#333]">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-neutral-500 dark:text-[#888]" />
          <span className="text-sm font-medium text-neutral-700 dark:text-[#dcddde]">
            {t.trash.title}
          </span>
          {trashItems.length > 0 && (
            <span className="text-xs text-neutral-400 dark:text-[#666]">
              ({trashItems.length})
            </span>
          )}
        </div>
        {trashItems.length > 0 && (
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <XCircle size={14} />
            {t.trash.emptyTrash}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-[#666]">
            <Trash2 size={48} className="mb-3 opacity-30" />
            <p className="text-sm">{t.trash.noItems}</p>
          </div>
        ) : (
          <div className="py-1">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-[#333]"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {item.type === 'folder' ? (
                    <Folder size={16} className="text-amber-500" />
                  ) : (
                    <FileText size={16} className="text-neutral-400 dark:text-[#888]" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-neutral-700 dark:text-[#dcddde]">
                    {getItemName(item)}
                  </div>
                  <div className="text-xs text-neutral-400 dark:text-[#666]">
                    {t.trash.deletedAt.replace('{time}', formatDeletedTime(item.deletedAt))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleRestore(item)}
                    className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-[#888] dark:hover:bg-[#404040] dark:hover:text-[#dcddde]"
                    title={t.trash.restore}
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-[#888] dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title={t.trash.permanentDelete}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permanent delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmItem} onOpenChange={() => setDeleteConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t.trash.permanentDelete}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.trash.permanentDeleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty trash confirmation dialog */}
      <AlertDialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t.trash.emptyTrash}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.trash.emptyTrashConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyTrash}
              className="bg-red-500 hover:bg-red-600"
            >
              {t.trash.emptyTrash}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
