import { create } from 'zustand';
import type { SchemaComponent } from '@/engine-v8';

interface EditorState {
  content: SchemaComponent[];
  selectedBlockId: string | null;
  history: SchemaComponent[][];
  historyIndex: number;

  setContent: (content: SchemaComponent[]) => void;
  setSelectedBlockId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: [],
  selectedBlockId: null,
  history: [[]],
  historyIndex: 0,

  setContent: (content) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    set({
      content,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        content: history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        content: history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));
