import { useState, useRef, useEffect } from 'react';
import { File, Folder } from 'lucide-react';
import { useVaultStore, useSettingsStore, useTabStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { createPage, createFolder } from '@/services/pageService';
import {
  validateCreateFolder,
  validateCreateNote,
  parseValidationMessage,
} from '../utils/folderValidation';

interface InlineCreateItemProps {
  type: 'folder' | 'page';
  level: number;
  parentId?: string;
  onCancel: () => void;
}

export function InlineCreateItem({
  type,
  level,
  parentId,
  onCancel,
}: InlineCreateItemProps) {
  const { t } = useTranslation();
  const { currentVault, addFolder, addPage, folders, pages } = useVaultStore();
  const { files: fileSettings } = useSettingsStore();
  const openTab = useTabStore((state) => state.openTab);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const paddingLeft = 8 + level * 16;

  /** Check if folder with same name exists in same directory */
  const checkFolderNameExists = (folderName: string): boolean => {
    return folders.some(
      (f) => f.parentId === parentId && f.name.toLowerCase() === folderName.toLowerCase()
    );
  };

  /** Check if page with same name exists in same directory */
  const checkPageNameExists = (pageName: string): boolean => {
    return pages.some(
      (p) => p.parentId === parentId && p.title.toLowerCase() === pageName.toLowerCase()
    );
  };

  useEffect(() => {
    // Auto-focus input
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || !currentVault || isSubmitting) {
      onCancel();
      return;
    }

    // Check folder name duplicate
    if (type === 'folder' && checkFolderNameExists(trimmedName)) {
      setError(t.files?.folderNameExists || '');
      inputRef.current?.focus();
      return;
    }

    // Check page name duplicate
    if (type === 'page' && checkPageNameExists(trimmedName)) {
      setError(t.files?.pageNameExists || '');
      inputRef.current?.focus();
      return;
    }

    // Validate folder restrictions
    const validation =
      type === 'folder'
        ? validateCreateFolder(parentId, folders, fileSettings)
        : validateCreateNote(parentId, pages, fileSettings);

    if (!validation.allowed) {
      const errorMsg = validation.error
        ? parseValidationMessage(validation.error, t.files as Record<string, string>)
        : '';
      setError(errorMsg);
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      if (type === 'folder') {
        // Create folder and persist
        const folder = await createFolder(currentVault.path, trimmedName, { parentId });
        if (folder) {
          addFolder(folder);
        }
      } else {
        // Create page and persist
        const result = await createPage(currentVault.path, trimmedName, { parentId, pages });
        if (result) {
          addPage(result.pageRef);
          // Auto-open page after creation
          openTab(result.pageRef.id, result.pageRef.title, result.pageRef.icon, result.pageRef.iconType);
        }
      }
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsSubmitting(false);
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Delay handling to prevent immediate trigger when clicking other buttons
    setTimeout(() => {
      if (!isSubmitting) {
        handleSubmit();
      }
    }, 100);
  };

  return (
    <div
      className="flex items-center gap-1 py-1 pr-2"
      style={{ paddingLeft }}
    >
      {/* Placeholder (align with arrow position) */}
      <div className="flex h-4 w-4 items-center justify-center" />

      {/* Icon */}
      <div className="flex h-4 w-4 items-center justify-center">
        {type === 'folder' ? (
          <Folder size={16} className="text-amber-500" />
        ) : (
          <File size={16} className="text-neutral-400 dark:text-[#888]" />
        )}
      </div>

      {/* Input */}
      <div className="flex flex-1 flex-col">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSubmitting}
          placeholder={type === 'folder' ? t.files?.folderNamePlaceholder || '' : t.files?.pageNamePlaceholder || ''}
          className={`flex-1 rounded border bg-white px-1.5 py-0.5 text-sm text-neutral-800 outline-none disabled:opacity-50 dark:bg-[#2b2b2b] dark:text-[#dcddde] ${
            error ? 'border-red-500' : 'border-[#7f6df2]'
          }`}
        />
        {error && (
          <span className="mt-0.5 text-xs text-red-500">{error}</span>
        )}
      </div>
    </div>
  );
}
