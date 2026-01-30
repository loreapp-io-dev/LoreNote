/**
 * tabStateService - Tab State File Storage Service
 *
 * Persists tab state to file system, replacing localStorage
 * Storage location: ~/.lorenote/tab-state.json
 */
import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { Tab, RecentVisit } from '@/stores/tabStore';

/** Tab state data structure */
export interface TabStateData {
  tabs: Tab[];
  activeTabId: string | null;
  recentVisits: RecentVisit[];
}

const TAB_STATE_FILE = 'tab-state.json';

/**
 * Load tab state
 */
export async function loadTabState(): Promise<TabStateData | null> {
  try {
    const fileExists = await exists(TAB_STATE_FILE, { baseDir: BaseDirectory.AppData });
    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(TAB_STATE_FILE, { baseDir: BaseDirectory.AppData });
    const data = JSON.parse(content) as TabStateData;
    return data;
  } catch (error) {
    console.error('[tabStateService] Error loading tab state:', error);
    return null;
  }
}

/**
 * Save tab state
 */
export async function saveTabState(data: TabStateData): Promise<boolean> {
  try {
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(TAB_STATE_FILE, content, { baseDir: BaseDirectory.AppData });
    return true;
  } catch (error) {
    console.error('[tabStateService] Error saving tab state:', error);
    return false;
  }
}

/**
 * Clear tab state
 */
export async function clearTabState(): Promise<boolean> {
  try {
    const emptyData: TabStateData = {
      tabs: [],
      activeTabId: null,
      recentVisits: [],
    };
    return await saveTabState(emptyData);
  } catch (error) {
    console.error('[tabStateService] Error clearing tab state:', error);
    return false;
  }
}
