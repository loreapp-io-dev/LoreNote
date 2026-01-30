import { useCallback } from 'react';
import { useVaultStore, useTabStore, HOME_PAGE_ID, DEV_TOOLS_TAB_ID, COMPONENT_DETAIL_TAB_ID } from '@/stores';
import { useEditorActions, useTabContent, useHasUnsavedChanges } from '@/stores/editorSelectors';
import { loadPage, savePage, createPage, deletePage } from '@/services/pageService';
import type { Component } from '@/types';

/**
 * usePage - Page operations hook
 *
 * Connects vault system and editor, provides page loading, saving, and creating operations
 */
export function usePage() {
  const {
    currentVault,
    pages,
    currentPageId,
    setCurrentPage,
    addPage,
    removePage,
    updatePage,
  } = useVaultStore();

  const { activeTabId } = useTabStore();
  const editorActions = useEditorActions();
  const content = useTabContent(activeTabId || '');
  const hasUnsavedChanges = useHasUnsavedChanges(activeTabId || '');

  /**
   * Open page - Load page content to editor
   */
  const openPage = useCallback(
    async (pageId: string) => {
      if (!activeTabId) {
        console.error('[usePage] No active tab');
        return false;
      }

      // Special page handling: home, developer tools, component details
      if (pageId === HOME_PAGE_ID || pageId === DEV_TOOLS_TAB_ID || pageId === COMPONENT_DETAIL_TAB_ID) {
        // These special pages don't need to load content, rendered by their own components
        editorActions.setContent(activeTabId, null);
        setCurrentPage(null);
        return true;
      }

      if (!currentVault?.path) {
        console.error('[usePage] No vault open');
        return false;
      }

      // Check if page exists
      const pageRef = pages.find((p) => p.id === pageId);
      if (!pageRef) {
        console.error('[usePage] Page not found:', pageId);
        return false;
      }

      try {
        const pageFile = await loadPage(currentVault.path, pageId);
        if (pageFile) {
          editorActions.setContent(activeTabId, pageFile.page.content);
          setCurrentPage(pageId);
          return true;
        } else {
          console.warn('[usePage] Page file not found, creating empty content:', pageId);
          // Page file not found, create empty content
          editorActions.setContent(activeTabId, null);
          setCurrentPage(pageId);
          return true;
        }
      } catch (error) {
        console.warn('[usePage] Error opening page, using empty content:', error);
        // Use empty content on error to avoid blocking user
        editorActions.setContent(activeTabId, null);
        setCurrentPage(pageId);
        return false;
      }
    },
    [activeTabId, currentVault, pages, editorActions, setCurrentPage]
  );

  /**
   * Save current page
   */
  const saveCurrentPage = useCallback(async () => {
    if (!activeTabId || !currentVault?.path || !currentPageId || !content) {
      return false;
    }

    try {
      const success = await savePage(currentVault.path, currentPageId, content, { pages });
      if (success) {
        editorActions.markSaved(activeTabId);
        // Update page's updatedAt
        updatePage(currentPageId, { updatedAt: new Date().toISOString() });
      }
      return success;
    } catch (error) {
      console.error('Error saving page:', error);
      return false;
    }
  }, [activeTabId, currentVault, currentPageId, content, pages, editorActions, updatePage]);

  /**
   * Create new page
   */
  const createNewPage = useCallback(
    async (title: string, parentId?: string) => {
      if (!activeTabId || !currentVault?.path) {
        console.error('No vault open or no active tab');
        return null;
      }

      try {
        const result = await createPage(currentVault.path, title, { parentId, pages });
        if (result) {
          addPage(result.pageRef);
          // Open newly created page
          editorActions.setContent(activeTabId, result.pageFile.page.content);
          setCurrentPage(result.pageRef.id);
          return result.pageRef;
        }
        return null;
      } catch (error) {
        console.error('Error creating page:', error);
        return null;
      }
    },
    [activeTabId, currentVault, addPage, editorActions, setCurrentPage]
  );

  /**
   * Delete page
   */
  const deleteCurrentPage = useCallback(
    async (pageId: string) => {
      if (!activeTabId || !currentVault?.path) {
        return false;
      }

      try {
        const success = await deletePage(currentVault.path, pageId);
        if (success) {
          removePage(pageId);
          // If deleting current page, clear editor
          if (currentPageId === pageId) {
            editorActions.setContent(activeTabId, null);
            setCurrentPage(null);
          }
        }
        return success;
      } catch (error) {
        console.error('Error deleting page:', error);
        return false;
      }
    },
    [activeTabId, currentVault, currentPageId, removePage, editorActions, setCurrentPage]
  );

  /**
   * Update page content (for editor real-time updates)
   */
  const updateContent = useCallback(
    (newContent: Component) => {
      if (!activeTabId) return;
      editorActions.setContent(activeTabId, newContent);
      editorActions.markUnsaved(activeTabId);
    },
    [activeTabId, editorActions]
  );

  return {
    // State
    currentVault,
    pages,
    currentPageId,
    content,
    hasUnsavedChanges,

    // Actions
    openPage,
    saveCurrentPage,
    createNewPage,
    deleteCurrentPage,
    updateContent,
  };
}
