import { open } from '@tauri-apps/plugin-dialog';
import type {
  Vault,
  VaultMetadata,
  VaultRegistry,
  VaultRegistryEntry,
  PageReference,
  FolderReference,
  TrashItem,
} from '@/types';
import {
  readJsonFile,
  writeJsonFile,
  pathExists,
  ensureDir,
  joinPath,
  getAppDataPath,
  removePath,
} from '@/services/fs';
import { generateId } from '@/utils';

const VAULT_CONFIG_DIR = '.lorenote';
const VAULT_CONFIG_FILE = 'vault.json';
const VAULT_REGISTRY_FILE = 'vaults.json';
const CURRENT_VERSION = '1.0.0';

// ============================================
// Vault Registry Management (stored in app data directory)
// ============================================

/** Get vault registry path */
async function getRegistryPath(): Promise<string> {
  const appData = await getAppDataPath();
  return joinPath(appData, VAULT_REGISTRY_FILE);
}

/** Load vault registry */
export async function loadVaultRegistry(): Promise<VaultRegistry> {
  try {
    const registryPath = await getRegistryPath();
    const registry = await readJsonFile<VaultRegistry>(registryPath);

    if (registry) {
      return registry;
    }

    // File not found, create empty registry file
    console.log('[vaultService] Registry file not found, creating empty registry');
    const emptyRegistry: VaultRegistry = {
      version: CURRENT_VERSION,
      vaults: [],
    };
    await saveVaultRegistry(emptyRegistry);
    return emptyRegistry;
  } catch (error) {
    console.error('Failed to load vault registry:', error);
  }

  // Return empty registry
  return {
    version: CURRENT_VERSION,
    vaults: [],
  };
}

/** Save vault registry */
async function saveVaultRegistry(registry: VaultRegistry): Promise<boolean> {
  try {
    const appData = await getAppDataPath();
    await ensureDir(appData);

    const registryPath = await getRegistryPath();
    return writeJsonFile(registryPath, registry);
  } catch (error) {
    console.error('Failed to save vault registry:', error);
    return false;
  }
}

/** Add vault to registry */
export async function addVaultToRegistry(vault: Vault): Promise<boolean> {
  const registry = await loadVaultRegistry();

  // Check if already exists
  const existingIndex = registry.vaults.findIndex((v) => v.path === vault.path);
  if (existingIndex >= 0) {
    // Update existing entry
    registry.vaults[existingIndex] = {
      id: vault.id,
      name: vault.name,
      path: vault.path,
      addedAt: registry.vaults[existingIndex].addedAt,
      lastOpenedAt: new Date().toISOString(),
    };
  } else {
    // Add new entry
    registry.vaults.push({
      id: vault.id,
      name: vault.name,
      path: vault.path,
      addedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    });
  }

  registry.lastOpenedVaultId = vault.id;
  return saveVaultRegistry(registry);
}

/** Remove vault from registry (does not delete files) */
export async function removeVaultFromRegistry(vaultId: string): Promise<boolean> {
  const registry = await loadVaultRegistry();
  registry.vaults = registry.vaults.filter((v) => v.id !== vaultId);

  if (registry.lastOpenedVaultId === vaultId) {
    registry.lastOpenedVaultId = undefined;
  }

  return saveVaultRegistry(registry);
}

/** Delete vault data */
export async function deleteVaultData(vaultPath: string): Promise<boolean> {
  try {
    // Delete entire vault directory
    return await removePath(vaultPath, true);
  } catch (error) {
    console.error('Failed to delete vault data:', error);
    return false;
  }
}

/** Update vault last opened time */
export async function updateVaultLastOpened(vaultId: string): Promise<boolean> {
  const registry = await loadVaultRegistry();
  const entry = registry.vaults.find((v) => v.id === vaultId);

  if (entry) {
    entry.lastOpenedAt = new Date().toISOString();
    registry.lastOpenedVaultId = vaultId;
    return saveVaultRegistry(registry);
  }

  return false;
}

/** Get registered vaults list */
export async function getRegisteredVaults(): Promise<VaultRegistryEntry[]> {
  const registry = await loadVaultRegistry();
  return registry.vaults;
}

// ============================================
// Vault Folder Management
// ============================================

/** Get vault config directory path */
async function getVaultConfigDir(vaultPath: string): Promise<string> {
  return joinPath(vaultPath, VAULT_CONFIG_DIR);
}

/** Get vault config file path */
async function getVaultConfigPath(vaultPath: string): Promise<string> {
  const configDir = await getVaultConfigDir(vaultPath);
  return joinPath(configDir, VAULT_CONFIG_FILE);
}

/** Check if path is a valid vault */
export async function isValidVault(path: string): Promise<boolean> {
  const configPath = await getVaultConfigPath(path);
  return pathExists(configPath);
}

/** Create new vault */
export async function createVault(
  path: string,
  name: string,
  description?: string
): Promise<Vault | null> {
  try {
    // Ensure directory exists
    await ensureDir(path);

    // Create config directory
    const configDir = await getVaultConfigDir(path);
    await ensureDir(configDir);

    const now = new Date().toISOString();
    const vault: Vault = {
      id: generateId(),
      name,
      path,
      description,
      createdAt: now,
      updatedAt: now,
    };

    const metadata: VaultMetadata = {
      version: CURRENT_VERSION,
      vault: {
        id: vault.id,
        name: vault.name,
        description: vault.description,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      },
      pages: [],
    };

    const configPath = await getVaultConfigPath(path);
    const success = await writeJsonFile(configPath, metadata);

    if (success) {
      // Add to registry
      await addVaultToRegistry(vault);
      return vault;
    }
    return null;
  } catch (error) {
    console.error('Failed to create vault:', error);
    return null;
  }
}

/** Open existing vault */
export async function openVault(path: string): Promise<Vault | null> {
  try {
    const isValid = await isValidVault(path);
    if (!isValid) {
      console.error('Not a valid vault:', path);
      return null;
    }

    const vault = await loadVault(path);
    if (vault) {
      // Add to registry
      await addVaultToRegistry(vault);
    }
    return vault;
  } catch (error) {
    console.error('Failed to open vault:', error);
    return null;
  }
}

/** Load vault metadata */
export async function loadVault(path: string): Promise<Vault | null> {
  try {
    const configPath = await getVaultConfigPath(path);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return null;
    }

    return {
      ...metadata.vault,
      path,
    };
  } catch (error) {
    console.error('Failed to load vault:', error);
    return null;
  }
}

/** Load vault's page list */
export async function loadVaultPages(path: string): Promise<PageReference[]> {
  try {
    const configPath = await getVaultConfigPath(path);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return [];
    }

    return metadata.pages;
  } catch (error) {
    console.error('Failed to load vault pages:', error);
    return [];
  }
}

/** Update vault metadata */
export async function updateVaultMetadata(
  path: string,
  updates: Partial<Omit<Vault, 'id' | 'path' | 'createdAt'>>
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(path);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    metadata.vault = {
      ...metadata.vault,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to update vault metadata:', error);
    return false;
  }
}

/** Save page reference to vault */
export async function savePageReference(
  vaultPath: string,
  pageRef: PageReference
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    const existingIndex = metadata.pages.findIndex((p) => p.id === pageRef.id);
    if (existingIndex >= 0) {
      metadata.pages[existingIndex] = pageRef;
    } else {
      metadata.pages.push(pageRef);
    }

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to save page reference:', error);
    return false;
  }
}

/** Delete page reference */
export async function deletePageReference(
  vaultPath: string,
  pageId: string
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    metadata.pages = metadata.pages.filter((p) => p.id !== pageId);
    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to delete page reference:', error);
    return false;
  }
}

// ============================================
// Dialogs
// ============================================

/** Select vault location (for creating new vault) */
export async function selectVaultLocation(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Vault Location',
    });

    if (typeof selected === 'string') {
      return selected;
    }
    return null;
  } catch (error) {
    console.error('Failed to select folder:', error);
    return null;
  }
}

/** Select existing vault folder */
export async function selectExistingVault(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Open Vault',
    });

    if (typeof selected === 'string') {
      return selected;
    }
    return null;
  } catch (error) {
    console.error('Failed to select vault:', error);
    return null;
  }
}

// ============================================
// Folder Management
// ============================================

/** Load vault's folder list */
export async function loadVaultFolders(path: string): Promise<FolderReference[]> {
  try {
    const configPath = await getVaultConfigPath(path);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return [];
    }

    return metadata.folders || [];
  } catch (error) {
    console.error('Failed to load vault folders:', error);
    return [];
  }
}

/** Save folder reference to vault */
export async function saveFolderReference(
  vaultPath: string,
  folderRef: FolderReference
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    // Ensure folders array exists
    if (!metadata.folders) {
      metadata.folders = [];
    }

    const existingIndex = metadata.folders.findIndex((f) => f.id === folderRef.id);
    if (existingIndex >= 0) {
      metadata.folders[existingIndex] = folderRef;
    } else {
      metadata.folders.push(folderRef);
    }

    metadata.vault.updatedAt = new Date().toISOString();

    return await writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to save folder reference:', error);
    return false;
  }
}

/** Delete folder reference */
export async function deleteFolderReference(
  vaultPath: string,
  folderId: string
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    if (metadata.folders) {
      metadata.folders = metadata.folders.filter((f) => f.id !== folderId);
    }

    // Move child folders and pages under this folder to root
    if (metadata.folders) {
      metadata.folders = metadata.folders.map((f) =>
        f.parentId === folderId ? { ...f, parentId: undefined } : f
      );
    }
    metadata.pages = metadata.pages.map((p) =>
      p.parentId === folderId ? { ...p, parentId: undefined } : p
    );

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to delete folder reference:', error);
    return false;
  }
}

// ============================================
// Trash Management
// ============================================

/** Load trash items list */
export async function loadTrashItems(vaultPath: string): Promise<TrashItem[]> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return [];
    }

    return metadata.trash || [];
  } catch (error) {
    console.error('Failed to load trash items:', error);
    return [];
  }
}

/** Move page to trash */
export async function movePageToTrash(
  vaultPath: string,
  pageId: string
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    const page = metadata.pages.find((p) => p.id === pageId);
    if (!page) {
      return false;
    }

    // Ensure trash array exists
    if (!metadata.trash) {
      metadata.trash = [];
    }

    // Create trash item
    const trashItem: TrashItem = {
      id: generateId(),
      type: 'page',
      originalData: page,
      originalParentId: page.parentId,
      deletedAt: new Date().toISOString(),
    };

    // Remove from page list
    metadata.pages = metadata.pages.filter((p) => p.id !== pageId);

    // Add to trash
    metadata.trash.push(trashItem);

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to move page to trash:', error);
    return false;
  }
}

/** Move folder to trash (including children) */
export async function moveFolderToTrash(
  vaultPath: string,
  folderId: string
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    const folder = metadata.folders?.find((f) => f.id === folderId);
    if (!folder) {
      return false;
    }

    // Ensure trash array exists
    if (!metadata.trash) {
      metadata.trash = [];
    }

    // Recursively collect all child folder IDs
    const collectChildFolderIds = (parentId: string): string[] => {
      const childIds: string[] = [];
      const children = metadata.folders?.filter((f) => f.parentId === parentId) || [];
      for (const child of children) {
        childIds.push(child.id);
        childIds.push(...collectChildFolderIds(child.id));
      }
      return childIds;
    };

    const allFolderIds = [folderId, ...collectChildFolderIds(folderId)];

    // Move all related pages to trash
    const pagesToTrash = metadata.pages.filter((p) =>
      p.parentId && allFolderIds.includes(p.parentId)
    );

    for (const page of pagesToTrash) {
      const trashItem: TrashItem = {
        id: generateId(),
        type: 'page',
        originalData: page,
        originalParentId: page.parentId,
        deletedAt: new Date().toISOString(),
      };
      metadata.trash.push(trashItem);
    }

    // Move all related folders to trash (from deepest to shallowest)
    const foldersToTrash = metadata.folders?.filter((f) => allFolderIds.includes(f.id)) || [];

    // Process child folders first
    for (const f of foldersToTrash) {
      if (f.id !== folderId) {
        const trashItem: TrashItem = {
          id: generateId(),
          type: 'folder',
          originalData: f,
          originalParentId: f.parentId,
          deletedAt: new Date().toISOString(),
        };
        metadata.trash.push(trashItem);
      }
    }

    // Finally process root folder
    const trashItem: TrashItem = {
      id: generateId(),
      type: 'folder',
      originalData: folder,
      originalParentId: folder.parentId,
      deletedAt: new Date().toISOString(),
    };
    metadata.trash.push(trashItem);

    // Remove from lists
    metadata.pages = metadata.pages.filter((p) =>
      !p.parentId || !allFolderIds.includes(p.parentId)
    );
    metadata.folders = metadata.folders?.filter((f) => !allFolderIds.includes(f.id));

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to move folder to trash:', error);
    return false;
  }
}

/** Restore item from trash */
export async function restoreFromTrash(
  vaultPath: string,
  trashItemId: string
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata || !metadata.trash) {
      return false;
    }

    const trashItem = metadata.trash.find((t) => t.id === trashItemId);
    if (!trashItem) {
      return false;
    }

    // Check if original parent still exists
    const parentExists = trashItem.originalParentId
      ? metadata.folders?.some((f) => f.id === trashItem.originalParentId)
      : true;

    if (trashItem.type === 'page') {
      const pageData = trashItem.originalData as PageReference;
      // If original parent doesn't exist, move to root
      const restoredPage: PageReference = {
        ...pageData,
        parentId: parentExists ? trashItem.originalParentId : undefined,
        updatedAt: new Date().toISOString(),
      };
      metadata.pages.push(restoredPage);
    } else {
      const folderData = trashItem.originalData as FolderReference;
      // If original parent doesn't exist, move to root
      const restoredFolder: FolderReference = {
        ...folderData,
        parentId: parentExists ? trashItem.originalParentId : undefined,
        updatedAt: new Date().toISOString(),
      };
      if (!metadata.folders) {
        metadata.folders = [];
      }
      metadata.folders.push(restoredFolder);
    }

    // Remove from trash
    metadata.trash = metadata.trash.filter((t) => t.id !== trashItemId);

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to restore from trash:', error);
    return false;
  }
}

/** Permanently delete trash item */
export async function permanentlyDeleteTrashItem(
  vaultPath: string,
  trashItemId: string
): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata || !metadata.trash) {
      return false;
    }

    const trashItem = metadata.trash.find((t) => t.id === trashItemId);
    if (!trashItem) {
      return false;
    }

    // If it's a page, delete the corresponding JSON file
    if (trashItem.type === 'page') {
      const pageData = trashItem.originalData as PageReference;
      const pagePath = await joinPath(vaultPath, pageData.filename);
      const exists = await pathExists(pagePath);
      if (exists) {
        await removePath(pagePath, false);
      }
    }

    // Remove from trash
    metadata.trash = metadata.trash.filter((t) => t.id !== trashItemId);

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to permanently delete trash item:', error);
    return false;
  }
}

/** Empty trash */
export async function emptyTrash(vaultPath: string): Promise<boolean> {
  try {
    const configPath = await getVaultConfigPath(vaultPath);
    const metadata = await readJsonFile<VaultMetadata>(configPath);

    if (!metadata) {
      return false;
    }

    // Delete all page JSON files
    if (metadata.trash) {
      for (const trashItem of metadata.trash) {
        if (trashItem.type === 'page') {
          const pageData = trashItem.originalData as PageReference;
          const pagePath = await joinPath(vaultPath, pageData.filename);
          const exists = await pathExists(pagePath);
          if (exists) {
            await removePath(pagePath, false);
          }
        }
      }
    }

    // Clear trash
    metadata.trash = [];

    metadata.vault.updatedAt = new Date().toISOString();

    return writeJsonFile(configPath, metadata);
  } catch (error) {
    console.error('Failed to empty trash:', error);
    return false;
  }
}

