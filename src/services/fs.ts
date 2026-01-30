import {
  readTextFile,
  writeTextFile,
  readDir,
  mkdir,
  exists,
  remove,
  rename,
} from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

/** Get app data directory */
export async function getAppDataPath(): Promise<string> {
  return await appDataDir();
}

/** Join paths */
export async function joinPath(...paths: string[]): Promise<string> {
  let result = paths[0];
  for (let i = 1; i < paths.length; i++) {
    result = await join(result, paths[i]);
  }
  return result;
}

/** Read JSON file */
export async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readTextFile(path);
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to read JSON file:', path, error);
    return null;
  }
}

/** Write JSON file */
export async function writeJsonFile(path: string, data: unknown): Promise<boolean> {
  try {
    // Ensure parent directory exists
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash > 0) {
      const dir = path.substring(0, lastSlash);
      await ensureDir(dir);
    }

    const content = JSON.stringify(data, null, 2);
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Failed to write JSON file:', path, error);
    return false;
  }
}

/** Read text file */
export async function readFile(path: string): Promise<string | null> {
  try {
    return await readTextFile(path);
  } catch (error) {
    console.error('Failed to read file:', path, error);
    return null;
  }
}

/** Write text file */
export async function writeFile(path: string, content: string): Promise<boolean> {
  try {
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Failed to write file:', path, error);
    return false;
  }
}

/** Check if path exists */
export async function pathExists(path: string): Promise<boolean> {
  try {
    return await exists(path);
  } catch {
    return false;
  }
}

/** Ensure directory exists */
export async function ensureDir(path: string): Promise<boolean> {
  try {
    const dirExists = await exists(path);
    if (!dirExists) {
      await mkdir(path, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to ensure directory:', path, error);
    return false;
  }
}

/** List directory contents */
export async function listDir(path: string): Promise<string[]> {
  try {
    const entries = await readDir(path);
    return entries.map((e) => e.name).filter((name): name is string => !!name);
  } catch (error) {
    console.error('Failed to list directory:', path, error);
    return [];
  }
}

/** Get directory entries with details */
export async function listDirWithInfo(path: string) {
  try {
    const entries = await readDir(path);
    return entries;
  } catch (error) {
    console.error('Failed to list directory:', path, error);
    return [];
  }
}

/** Delete file or directory */
export async function removePath(path: string, recursive = false): Promise<boolean> {
  try {
    await remove(path, { recursive });
    return true;
  } catch (error) {
    console.error('Failed to remove:', path, error);
    return false;
  }
}

/** Rename file or directory */
export async function renamePath(oldPath: string, newPath: string): Promise<boolean> {
  try {
    await rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Failed to rename:', oldPath, error);
    return false;
  }
}

/**
 * Simplified fs object providing unified file system operation interface
 */
export const fs = {
  readTextFile: readFile,
  writeTextFile: writeFile,
  readJson: readJsonFile,
  writeJson: writeJsonFile,
  exists: pathExists,
  ensureDir,
  readDir: listDir,
  removeFile: async (path: string) => removePath(path, false),
  removeDir: async (path: string) => removePath(path, true),
};
