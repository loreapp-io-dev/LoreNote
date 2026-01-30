import { create } from 'zustand';
import type { Component } from '@/types';

interface TabEditorState {
  content: Component | null;
  hasUnsavedChanges: boolean;
}

interface TabEditorStore {
  tabs: Record<string, TabEditorState>;

  getTabState: (tabId: string) => TabEditorState;
  setTabContent: (tabId: string, content: Component | null) => void;
  setTabUnsavedChanges: (tabId: string, hasChanges: boolean) => void;
  clearTab: (tabId: string) => void;
}

export const useTabEditorStore = create<TabEditorStore>((set, get) => ({
  tabs: {},

  getTabState: (tabId) => {
    const state = get().tabs[tabId];
    return state || { content: null, hasUnsavedChanges: false };
  },

  setTabContent: (tabId, content) => {
    set((state) => ({
      tabs: {
        ...state.tabs,
        [tabId]: {
          ...state.tabs[tabId],
          content,
        },
      },
    }));
  },

  setTabUnsavedChanges: (tabId, hasChanges) => {
    set((state) => ({
      tabs: {
        ...state.tabs,
        [tabId]: {
          ...state.tabs[tabId],
          hasUnsavedChanges: hasChanges,
        },
      },
    }));
  },

  clearTab: (tabId) => {
    set((state) => {
      const { [tabId]: _, ...rest } = state.tabs;
      return { tabs: rest };
    });
  },
}));
