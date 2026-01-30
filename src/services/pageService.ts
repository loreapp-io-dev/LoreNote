/**
 * pageService - Page Content Management Service
 *
 * Responsible for:
 * - Creating, loading, and saving page content
 * - Reading and writing page JSON files
 * - Integration with link service
 */

import { fs } from './fs';
import { updateLinksForPage, handlePageDeletion, handlePageTitleUpdate } from './linkService';
import { savePageReference, deletePageReference, saveFolderReference } from './vaultService';
import type { Component, PageReference, FolderReference } from '@/types';
import { generateId } from '@/utils';

const CURRENT_VERSION = '1.0.0';

/**
 * Page file structure
 */
export interface PageFile {
  /** File version */
  version: string;
  /** Page data */
  page: {
    /** Page ID */
    id: string;
    /** Page title */
    title: string;
    /** Page icon */
    icon?: string;
    /** Icon type */
    iconType?: 'lucide' | 'emoji';
    /** Created time */
    createdAt: string;
    /** Updated time */
    updatedAt: string;
    /** Page content (component tree) */
    content: Component;
    /** Outgoing links */
    outgoingLinks?: Array<{
      targetPageId: string;
      targetBlockId?: string;
      sourceBlockId: string;
      createdAt: string;
    }>;
  };
}

/**
 * Create empty page content (V8 SchemaComponent format)
 */
export function createEmptyPageContent(): Component {
  return {
    element: 'div',
    id: generateId(),
    style: { className: 'flex flex-col gap-1' },
    children: [],
  } as Component;
}

/**
 * Create new page
 */
export async function createPage(
  vaultPath: string,
  title: string,
  options?: {
    icon?: string;
    iconType?: 'lucide' | 'emoji';
    parentId?: string;
    content?: Component;
    pages?: PageReference[];
  }
): Promise<{ pageRef: PageReference; pageFile: PageFile } | null> {
  try {
    const pageId = generateId();
    const filename = `${pageId}.json`;
    const now = new Date().toISOString();

    // Create page reference
    const pageRef: PageReference = {
      id: pageId,
      title,
      filename,
      icon: options?.icon,
      iconType: options?.iconType,
      parentId: options?.parentId,
      createdAt: now,
      updatedAt: now,
    };

    // Create page file content
    const pageFile: PageFile = {
      version: CURRENT_VERSION,
      page: {
        id: pageId,
        title,
        icon: options?.icon,
        iconType: options?.iconType,
        createdAt: now,
        updatedAt: now,
        content: options?.content || createEmptyPageContent(),
      },
    };

    // Save page file
    const pagePath = `${vaultPath}/${filename}`;
    await fs.writeJson(pagePath, pageFile);

    // Save page reference to vault.json
    await savePageReference(vaultPath, pageRef);

    // Update link index
    await updateLinksForPage(vaultPath, pageId, title, pageFile.page.content, options?.pages);

    return { pageRef, pageFile };
  } catch (error) {
    console.error('Failed to create page:', error);
    return null;
  }
}

/**
 * Load page content
 */
export async function loadPage(
  vaultPath: string,
  pageId: string
): Promise<PageFile | null> {
  try {
    const pagePath = `${vaultPath}/${pageId}.json`;
    const exists = await fs.exists(pagePath);

    if (!exists) {
      console.error('[pageService] Page file not found:', pagePath);
      return null;
    }

    const pageFile = await fs.readJson<PageFile>(pagePath);
    return pageFile;
  } catch (error) {
    console.error('[pageService] Failed to load page:', error);
    return null;
  }
}

/**
 * Save page content
 */
export async function savePage(
  vaultPath: string,
  pageId: string,
  content: Component,
  options?: {
    title?: string;
    icon?: string;
    iconType?: 'lucide' | 'emoji';
    pages?: PageReference[];
  }
): Promise<boolean> {
  try {
    const pagePath = `${vaultPath}/${pageId}.json`;
    console.log('[pageService] savePage() called', { pageId, vaultPath, contentElement: content.element });

    // Read existing page
    const existingPage = await loadPage(vaultPath, pageId);
    if (!existingPage) {
      console.error('[pageService] Page not found for saving:', pageId);
      return false;
    }

    const now = new Date().toISOString();

    // Update page content
    const updatedPage: PageFile = {
      ...existingPage,
      page: {
        ...existingPage.page,
        content,
        updatedAt: now,
        ...(options?.title && { title: options.title }),
        ...(options?.icon !== undefined && { icon: options.icon }),
        ...(options?.iconType !== undefined && { iconType: options.iconType }),
      },
    };

    console.log('[pageService] savePage() writing to file', { pagePath, childrenCount: content.children?.length });
    // Debug: check first child component's props
    if (content.children && content.children.length > 0) {
      const firstChild = content.children[0];
      if (typeof firstChild !== 'string') {
        console.log('[pageService] savePage() first child props', {
          element: firstChild.element,
          props: JSON.stringify(firstChild.props),
          data: JSON.stringify(firstChild.data)
        });
      }
    }
    // Save page file
    await fs.writeJson(pagePath, updatedPage);
    console.log('[pageService] savePage() file written successfully', { pagePath });

    // If title updated, sync update link index
    if (options?.title && options.title !== existingPage.page.title) {
      await handlePageTitleUpdate(vaultPath, pageId, options.title);
    }

    // Update link index
    await updateLinksForPage(
      vaultPath,
      pageId,
      options?.title || existingPage.page.title,
      content,
      options?.pages
    );

    return true;
  } catch (error) {
    console.error('Failed to save page:', error);
    return false;
  }
}

/**
 * Update page metadata (without updating content)
 */
export async function updatePageMetadata(
  vaultPath: string,
  pageId: string,
  updates: {
    title?: string;
    icon?: string;
    iconType?: 'lucide' | 'emoji';
  }
): Promise<boolean> {
  try {
    const pagePath = `${vaultPath}/${pageId}.json`;
    const existingPage = await loadPage(vaultPath, pageId);

    if (!existingPage) {
      return false;
    }

    const now = new Date().toISOString();

    // Update page metadata
    const updatedPage: PageFile = {
      ...existingPage,
      page: {
        ...existingPage.page,
        ...updates,
        updatedAt: now,
      },
    };

    await fs.writeJson(pagePath, updatedPage);

    // If title updated, sync update link index
    if (updates.title && updates.title !== existingPage.page.title) {
      await handlePageTitleUpdate(vaultPath, pageId, updates.title);
    }

    return true;
  } catch (error) {
    console.error('Failed to update page metadata:', error);
    return false;
  }
}

/**
 * Delete page
 */
export async function deletePage(
  vaultPath: string,
  pageId: string
): Promise<boolean> {
  try {
    const pagePath = `${vaultPath}/${pageId}.json`;

    // Delete page file
    const exists = await fs.exists(pagePath);
    if (exists) {
      await fs.removeFile(pagePath);
    }

    // Delete page reference
    await deletePageReference(vaultPath, pageId);

    // Clean up link index
    await handlePageDeletion(vaultPath, pageId);

    return true;
  } catch (error) {
    console.error('Failed to delete page:', error);
    return false;
  }
}

/**
 * Duplicate page
 */
export async function duplicatePage(
  vaultPath: string,
  sourcePageId: string,
  newTitle?: string
): Promise<{ pageRef: PageReference; pageFile: PageFile } | null> {
  try {
    // Load source page
    const sourcePage = await loadPage(vaultPath, sourcePageId);
    if (!sourcePage) {
      return null;
    }

    // Deep clone content and generate new IDs
    const newContent = deepCloneComponent(sourcePage.page.content);

    // Create new page
    return createPage(vaultPath, newTitle || `${sourcePage.page.title} (Copy)`, {
      icon: sourcePage.page.icon,
      iconType: sourcePage.page.iconType,
      content: newContent,
    });
  } catch (error) {
    console.error('Failed to duplicate page:', error);
    return null;
  }
}

/**
 * Deep clone component tree, generating new IDs
 */
function deepCloneComponent(component: Component): Component {
  const now = new Date().toISOString();

  const cloned: Component = {
    ...component,
    id: generateId(),
    meta: {
      ...component.meta,
      createdAt: now,
      updatedAt: now,
      // Clear sync block related info
      sourceId: undefined,
      isSynced: undefined,
    },
  };

  if (component.children) {
    cloned.children = component.children.map((child) => {
      if (typeof child === 'string') return child;
      return deepCloneComponent(child);
    });
  }

  return cloned;
}

/**
 * Check if page exists
 */
export async function pageExists(
  vaultPath: string,
  pageId: string
): Promise<boolean> {
  try {
    const pagePath = `${vaultPath}/${pageId}.json`;
    return await fs.exists(pagePath);
  } catch {
    return false;
  }
}

/**
 * Get page title
 */
export async function getPageTitle(
  vaultPath: string,
  pageId: string
): Promise<string | null> {
  try {
    const page = await loadPage(vaultPath, pageId);
    return page?.page.title || null;
  } catch {
    return null;
  }
}

/**
 * Batch load page content
 */
export async function loadPages(
  vaultPath: string,
  pageIds: string[]
): Promise<Map<string, PageFile>> {
  const results = new Map<string, PageFile>();

  await Promise.all(
    pageIds.map(async (pageId) => {
      const page = await loadPage(vaultPath, pageId);
      if (page) {
        results.set(pageId, page);
      }
    })
  );

  return results;
}

/**
 * Create new folder
 */
export async function createFolder(
  vaultPath: string,
  name: string,
  options?: {
    icon?: string;
    parentId?: string;
  }
): Promise<FolderReference | null> {
  try {
    const now = new Date().toISOString();
    const folderId = generateId();

    const folderRef: FolderReference = {
      id: folderId,
      name,
      icon: options?.icon,
      parentId: options?.parentId,
      createdAt: now,
      updatedAt: now,
    };

    const success = await saveFolderReference(vaultPath, folderRef);
    if (!success) {
      return null;
    }

    return folderRef;
  } catch (error) {
    console.error('Failed to create folder:', error);
    return null;
  }
}
