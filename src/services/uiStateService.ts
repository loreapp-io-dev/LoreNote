/**
 * uiStateService - UI State File Storage Service
 *
 * Persists UI state to file system, replacing localStorage
 * Storage location: ~/.lorenote/ui-state.json
 */
import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { NavItem } from '@/stores/uiStore';

/** UI state data structure */
export interface UIStateData {
  sidebarOpen: boolean;
  sidebarWidth: number;
  theme: 'light' | 'dark' | 'system';
  activeNav: NavItem;
  secondaryPanelWidth: number;
  componentsPanelWidth: number;
}

const UI_STATE_FILE = 'ui-state.json';

/**
 * Load UI state
 */
export async function loadUIState(): Promise<UIStateData | null> {
  try {
    const fileExists = await exists(UI_STATE_FILE, { baseDir: BaseDirectory.AppData });
    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(UI_STATE_FILE, { baseDir: BaseDirectory.AppData });
    const data = JSON.parse(content) as UIStateData;
    return data;
  } catch (error) {
    console.error('[uiStateService] Error loading UI state:', error);
    return null;
  }
}

/**
 * Save UI state
 */
export async function saveUIState(data: UIStateData): Promise<boolean> {
  try {
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(UI_STATE_FILE, content, { baseDir: BaseDirectory.AppData });
    return true;
  } catch (error) {
    console.error('[uiStateService] Error saving UI state:', error);
    return false;
  }
}
