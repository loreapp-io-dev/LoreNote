import { useTabEditorStore } from './tabEditorStore';
import type { Component } from '@/types';

export function useTabContent(tabId: string): Component | null {
  return useTabEditorStore((state) => state.getTabState(tabId).content);
}

export function useHasUnsavedChanges(tabId: string): boolean {
  return useTabEditorStore((state) => state.getTabState(tabId).hasUnsavedChanges);
}

export function useEditorActions() {
  const setTabContent = useTabEditorStore((state) => state.setTabContent);
  const setTabUnsavedChanges = useTabEditorStore((state) => state.setTabUnsavedChanges);
  const clearTab = useTabEditorStore((state) => state.clearTab);

  return {
    setTabContent,
    setTabUnsavedChanges,
    clearTab,
    setContent: setTabContent,
    markUnsaved: (tabId: string) => setTabUnsavedChanges(tabId, true),
    markSaved: (tabId: string) => setTabUnsavedChanges(tabId, false),
  };
}

export function useIsBlockSelected(_blockId: string): boolean {
  return false;
}

export function useIsBlockFocused(_blockId: string): boolean {
  return false;
}
