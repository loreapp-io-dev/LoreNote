import { useCallback } from 'react';
import { useVaultStore, useTabStore } from '@/stores';
import { useEditorActions } from '@/stores/editorSelectors';
import {
  createVault,
  openVault,
  loadVaultPages,
  loadVaultFolders,
  selectVaultLocation,
  selectExistingVault,
  updateVaultLastOpened,
  removeVaultFromRegistry,
  loadVaultRegistry,
} from '@/services/vaultService';
import { rebuildLinkIndex } from '@/services/linkService';
import { getTranslations } from '@/i18n';
import type { Vault } from '@/types';

export function useVault() {
  const {
    vaults,
    currentVault,
    pages,
    folders,
    currentPageId,
    setVaults,
    addVault,
    removeVault,
    setCurrentVault,
    setPages,
    setFolders,
    setCurrentPage,
    setLoading,
    setError,
    getCurrentPage,
  } = useVaultStore();

  const { activeTabId } = useTabStore();
  const editorActions = useEditorActions();

  /** Initialize: load registered vault list */
  const initVaults = useCallback(async () => {
    setLoading(true);
    try {
      const registry = await loadVaultRegistry();
      setVaults(registry.vaults);
      setLoading(false);
      return registry;
    } catch (error) {
      console.error('Failed to init vaults:', error);
      setError(getTranslations().vault.loadFailed);
      setLoading(false);
      return null;
    }
  }, [setVaults, setLoading, setError]);

  /** Create new vault */
  const createNewVault = useCallback(
    async (name: string, description?: string) => {
      setLoading(true);
      setError(null);

      try {
        // Select vault location
        const folderPath = await selectVaultLocation();
        if (!folderPath) {
          setLoading(false);
          return null;
        }

        // Create vault
        const vault = await createVault(folderPath, name, description);
        if (vault) {
          addVault({
            id: vault.id,
            name: vault.name,
            path: vault.path,
            addedAt: new Date().toISOString(),
            lastOpenedAt: new Date().toISOString(),
          });

          // Switch to new vault
          await switchVault(vault.id, vault);
        }

        setLoading(false);
        return vault;
      } catch (error) {
        console.error('Failed to create vault:', error);
        setError(getTranslations().vault.createFailed);
        setLoading(false);
        return null;
      }
    },
    [addVault, setLoading, setError]
  );

  /** Open existing vault */
  const openExistingVault = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Select vault folder
      const folderPath = await selectExistingVault();
      if (!folderPath) {
        setLoading(false);
        return null;
      }

      // Open vault
      const vault = await openVault(folderPath);
      if (vault) {
        addVault({
          id: vault.id,
          name: vault.name,
          path: vault.path,
          addedAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        });

        // Switch to this vault
        await switchVault(vault.id, vault);
      } else {
        setError(getTranslations().vault.invalidVault);
      }

      setLoading(false);
      return vault;
    } catch (error) {
      console.error('Failed to open vault:', error);
      setError(getTranslations().vault.openFailed);
      setLoading(false);
      return null;
    }
  }, [addVault, setLoading, setError]);

  /** Switch vault */
  const switchVault = useCallback(
    async (vaultId: string, vaultData?: Vault) => {
      // If vault data not provided, find from vaults list
      const vaultEntry = vaults.find((v) => v.id === vaultId);
      if (!vaultEntry && !vaultData) {
        return false;
      }

      setLoading(true);

      try {
        const vault = vaultData || (await openVault(vaultEntry!.path));
        if (!vault) {
          setError(getTranslations().vault.cannotLoad);
          setLoading(false);
          return false;
        }

        // Update last opened time
        await updateVaultLastOpened(vaultId);

        // Set current vault
        setCurrentVault(vault);

        // Load pages and folders list
        const [pageRefs, folderRefs] = await Promise.all([
          loadVaultPages(vault.path),
          loadVaultFolders(vault.path),
        ]);
        setPages(pageRefs);
        setFolders(folderRefs);

        // Rebuild link index
        await rebuildLinkIndex(vault.path, pageRefs);

        // If there are pages, select the first one
        if (pageRefs.length > 0) {
          setCurrentPage(pageRefs[0].id);
          // TODO: Load page content to editor
        } else {
          setCurrentPage(null);
          if (activeTabId) {
            editorActions.setContent(activeTabId, null);
          }
        }

        setLoading(false);
        return true;
      } catch (error) {
        console.error('Failed to switch vault:', error);
        setError(getTranslations().vault.switchFailed);
        setLoading(false);
        return false;
      }
    },
    [vaults, setCurrentVault, setPages, setFolders, setCurrentPage, activeTabId, editorActions, setLoading, setError]
  );

  /** Close vault (remove from registry, don't delete files) */
  const closeVault = useCallback(
    async (vaultId: string) => {
      try {
        await removeVaultFromRegistry(vaultId);
        removeVault(vaultId);

        // If closing current vault, clear state
        if (currentVault?.id === vaultId) {
          setCurrentVault(null);
          setPages([]);
          setCurrentPage(null);
          if (activeTabId) {
            editorActions.setContent(activeTabId, null);
          }
        }

        return true;
      } catch (error) {
        console.error('Failed to close vault:', error);
        return false;
      }
    },
    [currentVault, removeVault, setCurrentVault, setPages, setCurrentPage, activeTabId, editorActions]
  );

  return {
    // State
    vaults,
    currentVault,
    pages,
    folders,
    currentPageId,
    currentPage: getCurrentPage(),

    // Actions
    initVaults,
    createNewVault,
    openExistingVault,
    switchVault,
    closeVault,
  };
}
