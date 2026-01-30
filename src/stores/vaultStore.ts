/**
 * vaultStore - Vault State Management
 *
 * Manages:
 * - Registered vault list
 * - Currently open vault and its pages, folders
 * - Folder expansion state
 * - Currently open page
 *
 * Note: Folders are a pure metadata concept, all note files are stored in the vault root directory,
 * folders organize display structure through the parentId field.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Vault, VaultRegistryEntry, PageReference, FolderReference, TrashItem } from '@/types';
import {
  savePageReference,
  saveFolderReference,
  movePageToTrash as movePageToTrashService,
  moveFolderToTrash as moveFolderToTrashService,
  restoreFromTrash as restoreFromTrashService,
  permanentlyDeleteTrashItem as permanentlyDeleteTrashItemService,
  emptyTrash as emptyTrashService,
} from '@/services/vaultService';

interface VaultState {
  /** Registered vault list */
  vaults: VaultRegistryEntry[];
  /** Currently open vault */
  currentVault: Vault | null;
  /** Current vault's page list */
  pages: PageReference[];
  /** Current vault's folder list */
  folders: FolderReference[];
  /** Set of expanded folder IDs */
  expandedFolderIds: string[];
  /** Currently open page ID */
  currentPageId: string | null;
  /** Currently selected folder ID */
  selectedFolderId: string | null;
  /** Trash items list */
  trashItems: TrashItem[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;

  // Vault Actions
  setVaults: (vaults: VaultRegistryEntry[]) => void;
  addVault: (vault: VaultRegistryEntry) => void;
  removeVault: (vaultId: string) => void;
  setCurrentVault: (vault: Vault | null) => void;

  // Page Actions
  setPages: (pages: PageReference[]) => void;
  addPage: (page: PageReference) => void;
  updatePage: (pageId: string, updates: Partial<PageReference>) => void;
  removePage: (pageId: string) => void;
  setCurrentPage: (pageId: string | null) => void;

  // Folder Actions
  setFolders: (folders: FolderReference[]) => void;
  addFolder: (folder: FolderReference) => void;
  updateFolder: (folderId: string, updates: Partial<FolderReference>) => void;
  removeFolder: (folderId: string) => void;
  toggleFolderExpand: (folderId: string) => void;
  setExpandedFolderIds: (ids: string[]) => void;
  setSelectedFolderId: (folderId: string | null) => void;

  // Trash Actions
  setTrashItems: (items: TrashItem[]) => void;
  movePageToTrash: (pageId: string) => Promise<boolean>;
  moveFolderToTrash: (folderId: string) => Promise<boolean>;
  restoreFromTrash: (trashItemId: string) => Promise<boolean>;
  permanentlyDeleteTrashItem: (trashItemId: string) => Promise<boolean>;
  emptyTrash: () => Promise<boolean>;

  // General Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  getCurrentPage: () => PageReference | undefined;
}

const initialState = {
  vaults: [],
  currentVault: null,
  pages: [],
  folders: [],
  expandedFolderIds: [],
  currentPageId: null,
  selectedFolderId: null,
  trashItems: [],
  isLoading: false,
  error: null,
};

export const useVaultStore = create<VaultState>()(
  subscribeWithSelector((set, get) => ({
  ...initialState,

  // ==================== Vault Actions ====================

  setVaults: (vaults) => set({ vaults }),

  addVault: (vault) =>
    set((state) => {
      const exists = state.vaults.some((v) => v.id === vault.id);
      if (exists) {
        // Update existing vault
        return {
          vaults: state.vaults.map((v) => (v.id === vault.id ? vault : v)),
        };
      }
      return { vaults: [...state.vaults, vault] };
    }),

  removeVault: (vaultId) =>
    set((state) => ({
      vaults: state.vaults.filter((v) => v.id !== vaultId),
      currentVault: state.currentVault?.id === vaultId ? null : state.currentVault,
    })),

  setCurrentVault: (vault) =>
    set({
      currentVault: vault,
      pages: [],
      folders: [],
      expandedFolderIds: [],
      currentPageId: null,
      trashItems: [],
    }),

  // ==================== Page Actions ====================

  setPages: (pages) => set({ pages }),

  addPage: (page) =>
    set((state) => {
      const exists = state.pages.some((p) => p.id === page.id);
      if (exists) {
        return {
          pages: state.pages.map((p) => (p.id === page.id ? page : p)),
        };
      }
      return { pages: [...state.pages, page] };
    }),

  updatePage: (pageId, updates) => {
    const state = get();
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return;

    const updatedPage = { ...page, ...updates, updatedAt: new Date().toISOString() };
    set({
      pages: state.pages.map((p) => (p.id === pageId ? updatedPage : p)),
    });

    // Persist to file
    if (state.currentVault?.path) {
      savePageReference(state.currentVault.path, updatedPage);
    }
  },

  removePage: (pageId) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== pageId),
      currentPageId: state.currentPageId === pageId ? null : state.currentPageId,
    })),

  setCurrentPage: (pageId) => set({ currentPageId: pageId }),

  // ==================== Folder Actions ====================

  setFolders: (folders) => set({ folders }),

  addFolder: (folder) =>
    set((state) => {
      const exists = state.folders.some((f) => f.id === folder.id);
      if (exists) {
        return {
          folders: state.folders.map((f) => (f.id === folder.id ? folder : f)),
        };
      }
      return { folders: [...state.folders, folder] };
    }),

  updateFolder: (folderId, updates) => {
    const state = get();
    const folder = state.folders.find((f) => f.id === folderId);
    if (!folder) return;

    const updatedFolder = { ...folder, ...updates, updatedAt: new Date().toISOString() };
    set({
      folders: state.folders.map((f) => (f.id === folderId ? updatedFolder : f)),
    });

    // Persist to file
    if (state.currentVault?.path) {
      saveFolderReference(state.currentVault.path, updatedFolder);
    }
  },

  removeFolder: (folderId) =>
    set((state) => {
      // When deleting a folder, move its children to root
      const updatedPages = state.pages.map((p) =>
        p.parentId === folderId ? { ...p, parentId: undefined } : p
      );
      const updatedFolders = state.folders
        .filter((f) => f.id !== folderId)
        .map((f) => (f.parentId === folderId ? { ...f, parentId: undefined } : f));

      return {
        folders: updatedFolders,
        pages: updatedPages,
        expandedFolderIds: state.expandedFolderIds.filter((id) => id !== folderId),
      };
    }),

  toggleFolderExpand: (folderId) =>
    set((state) => {
      const isExpanded = state.expandedFolderIds.includes(folderId);
      return {
        expandedFolderIds: isExpanded
          ? state.expandedFolderIds.filter((id) => id !== folderId)
          : [...state.expandedFolderIds, folderId],
      };
    }),

  setExpandedFolderIds: (ids) => set({ expandedFolderIds: ids }),

  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),

  // ==================== Trash Actions ====================

  setTrashItems: (trashItems) => set({ trashItems }),

  movePageToTrash: async (pageId) => {
    const state = get();
    if (!state.currentVault?.path) return false;

    const success = await movePageToTrashService(state.currentVault.path, pageId);
    if (success) {
      const page = state.pages.find((p) => p.id === pageId);
      if (page) {
        // Create trash item
        const trashItem: TrashItem = {
          id: `trash-${Date.now()}`,
          type: 'page',
          originalData: page,
          originalParentId: page.parentId,
          deletedAt: new Date().toISOString(),
        };
        set({
          pages: state.pages.filter((p) => p.id !== pageId),
          trashItems: [...state.trashItems, trashItem],
          currentPageId: state.currentPageId === pageId ? null : state.currentPageId,
        });
      }
    }
    return success;
  },

  moveFolderToTrash: async (folderId) => {
    const state = get();
    if (!state.currentVault?.path) return false;

    const success = await moveFolderToTrashService(state.currentVault.path, folderId);
    if (success) {
      // Recursively collect all child folder IDs
      const collectChildFolderIds = (parentId: string): string[] => {
        const childIds: string[] = [];
        const children = state.folders.filter((f) => f.parentId === parentId);
        for (const child of children) {
          childIds.push(child.id);
          childIds.push(...collectChildFolderIds(child.id));
        }
        return childIds;
      };

      const allFolderIds = [folderId, ...collectChildFolderIds(folderId)];

      // Collect affected pages and folders
      const affectedPages = state.pages.filter((p) =>
        p.parentId && allFolderIds.includes(p.parentId)
      );
      const affectedFolders = state.folders.filter((f) => allFolderIds.includes(f.id));

      // Create trash items
      const newTrashItems: TrashItem[] = [];
      for (const page of affectedPages) {
        newTrashItems.push({
          id: `trash-${Date.now()}-${page.id}`,
          type: 'page',
          originalData: page,
          originalParentId: page.parentId,
          deletedAt: new Date().toISOString(),
        });
      }
      for (const folder of affectedFolders) {
        newTrashItems.push({
          id: `trash-${Date.now()}-${folder.id}`,
          type: 'folder',
          originalData: folder,
          originalParentId: folder.parentId,
          deletedAt: new Date().toISOString(),
        });
      }

      set({
        pages: state.pages.filter((p) => !p.parentId || !allFolderIds.includes(p.parentId)),
        folders: state.folders.filter((f) => !allFolderIds.includes(f.id)),
        trashItems: [...state.trashItems, ...newTrashItems],
        expandedFolderIds: state.expandedFolderIds.filter((id) => !allFolderIds.includes(id)),
      });
    }
    return success;
  },

  restoreFromTrash: async (trashItemId) => {
    const state = get();
    if (!state.currentVault?.path) return false;

    const success = await restoreFromTrashService(state.currentVault.path, trashItemId);
    if (success) {
      const trashItem = state.trashItems.find((t) => t.id === trashItemId);
      if (trashItem) {
        // Check if original parent still exists
        const parentExists = trashItem.originalParentId
          ? state.folders.some((f) => f.id === trashItem.originalParentId)
          : true;

        if (trashItem.type === 'page') {
          const pageData = trashItem.originalData as PageReference;
          const restoredPage: PageReference = {
            ...pageData,
            parentId: parentExists ? trashItem.originalParentId : undefined,
            updatedAt: new Date().toISOString(),
          };
          set({
            pages: [...state.pages, restoredPage],
            trashItems: state.trashItems.filter((t) => t.id !== trashItemId),
          });
        } else {
          const folderData = trashItem.originalData as FolderReference;
          const restoredFolder: FolderReference = {
            ...folderData,
            parentId: parentExists ? trashItem.originalParentId : undefined,
            updatedAt: new Date().toISOString(),
          };
          set({
            folders: [...state.folders, restoredFolder],
            trashItems: state.trashItems.filter((t) => t.id !== trashItemId),
          });
        }
      }
    }
    return success;
  },

  permanentlyDeleteTrashItem: async (trashItemId) => {
    const state = get();
    if (!state.currentVault?.path) return false;

    const success = await permanentlyDeleteTrashItemService(state.currentVault.path, trashItemId);
    if (success) {
      set({
        trashItems: state.trashItems.filter((t) => t.id !== trashItemId),
      });
    }
    return success;
  },

  emptyTrash: async () => {
    const state = get();
    if (!state.currentVault?.path) return false;

    const success = await emptyTrashService(state.currentVault.path);
    if (success) {
      set({ trashItems: [] });
    }
    return success;
  },

  // ==================== General Actions ====================

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),

  // ==================== Computed ====================

  getCurrentPage: () => {
    const state = get();
    return state.pages.find((p) => p.id === state.currentPageId);
  },
})));
