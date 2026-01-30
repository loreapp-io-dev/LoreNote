import { create } from 'zustand';

interface SlashCommandState {
  isOpen: boolean;
  position: { x: number; y: number };
  editorWidth: number;
  filter: string;
  pageId: string | null;
  vaultPath: string | null;

  open: (pageId: string, vaultPath: string, position: { x: number; y: number }, editorWidth: number) => void;
  close: () => void;
  setFilter: (filter: string) => void;
}

export const useSlashCommandStore = create<SlashCommandState>((set) => ({
  isOpen: false,
  position: { x: 0, y: 0 },
  editorWidth: 0,
  filter: '',
  pageId: null,
  vaultPath: null,

  open: (pageId, vaultPath, position, editorWidth) => {
    set({ isOpen: true, position, editorWidth, pageId, vaultPath, filter: '' });
  },

  close: () => {
    set({ isOpen: false, filter: '', pageId: null, vaultPath: null });
  },

  setFilter: (filter) => {
    set({ filter });
  },
}));
