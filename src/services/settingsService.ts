import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  readJsonFile,
  writeJsonFile,
  getAppDataPath,
  joinPath,
  ensureDir,
} from '@/services/fs';

const SETTINGS_FILE = 'settings.json';

/** Get settings file path */
async function getSettingsPath(): Promise<string> {
  const appData = await getAppDataPath();
  return joinPath(appData, SETTINGS_FILE);
}

/** Load settings */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const settingsPath = await getSettingsPath();
    const settings = await readJsonFile<AppSettings>(settingsPath);

    if (settings) {
      // Merge with defaults to ensure new fields have default values
      return {
        appearance: { ...DEFAULT_SETTINGS.appearance, ...settings.appearance },
        editor: { ...DEFAULT_SETTINGS.editor, ...settings.editor },
        files: { ...DEFAULT_SETTINGS.files, ...settings.files },
        advanced: { ...DEFAULT_SETTINGS.advanced, ...settings.advanced },
        local: { ...DEFAULT_SETTINGS.local, ...settings.local },
      };
    }

    // File not found, create default settings file
    console.log('[settingsService] Settings file not found, creating default settings');
    await saveSettings(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/** Save settings */
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    const appData = await getAppDataPath();
    await ensureDir(appData);

    const settingsPath = await getSettingsPath();
    return writeJsonFile(settingsPath, settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/** Reset settings */
export async function resetSettings(): Promise<boolean> {
  return saveSettings(DEFAULT_SETTINGS);
}
