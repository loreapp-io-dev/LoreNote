import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AppSettings,
  AppearanceSettings,
  EditorSettings,
  FileSettings,
  AdvancedSettings,
  LocalState,
  Theme,
} from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { Locale } from '@/i18n';
import { loadSettings, saveSettings } from '@/services/settingsService';

interface SettingsState extends AppSettings {
  // Settings panel state
  isSettingsOpen: boolean;
  activeCategory: string;
  _initialized: boolean;

  // Actions
  openSettings: (category?: string) => void;
  closeSettings: () => void;
  setActiveCategory: (category: string) => void;

  // Appearance settings
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;

  // Editor settings
  updateEditor: (settings: Partial<EditorSettings>) => void;

  // File settings
  updateFiles: (settings: Partial<FileSettings>) => void;

  // Advanced settings
  updateAdvanced: (settings: Partial<AdvancedSettings>) => void;

  // Local state
  updateLocal: (settings: Partial<LocalState>) => void;
  markGettingStartedRead: (id: string) => void;

  // Reset
  resetSettings: () => void;
  resetCategory: (category: keyof AppSettings) => void;

  // Initialize
  initSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set) => ({
    ...DEFAULT_SETTINGS,
    isSettingsOpen: false,
    activeCategory: 'appearance',
    _initialized: false,

    openSettings: (category = 'appearance') =>
      set({ isSettingsOpen: true, activeCategory: category }),

    closeSettings: () => set({ isSettingsOpen: false }),

    setActiveCategory: (category) => set({ activeCategory: category }),

    setTheme: (theme) =>
      set((state) => ({
        appearance: { ...state.appearance, theme },
      })),

    setLocale: (locale) =>
      set((state) => ({
        appearance: { ...state.appearance, locale },
      })),

    updateAppearance: (settings) =>
      set((state) => ({
        appearance: { ...state.appearance, ...settings },
      })),

    updateEditor: (settings) =>
      set((state) => ({
        editor: { ...state.editor, ...settings },
      })),

    updateFiles: (settings) =>
      set((state) => ({
        files: { ...state.files, ...settings },
      })),

    updateAdvanced: (settings) =>
      set((state) => ({
        advanced: { ...state.advanced, ...settings },
      })),

    updateLocal: (settings) =>
      set((state) => ({
        local: { ...state.local, ...settings },
      })),

    markGettingStartedRead: (id) =>
      set((state) => ({
        local: {
          ...state.local,
          gettingStartedRead: state.local.gettingStartedRead.includes(id)
            ? state.local.gettingStartedRead
            : [...state.local.gettingStartedRead, id],
        },
      })),

    resetSettings: () =>
      set({
        ...DEFAULT_SETTINGS,
        isSettingsOpen: true,
      }),

    resetCategory: (category) =>
      set({
        [category]: DEFAULT_SETTINGS[category],
      }),

    initSettings: async () => {
      const settings = await loadSettings();
      set({
        ...settings,
        _initialized: true,
      });
    },
  }))
);

// Subscribe to settings changes, auto-save to file
useSettingsStore.subscribe(
  (state) => ({
    appearance: state.appearance,
    editor: state.editor,
    files: state.files,
    advanced: state.advanced,
    local: state.local,
  }),
  (settings, prevSettings) => {
    // Only save when initialized and settings have changed
    const state = useSettingsStore.getState();
    if (state._initialized && settings !== prevSettings) {
      saveSettings(settings);
    }
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
);
