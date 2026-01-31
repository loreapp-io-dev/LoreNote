/**
 * Analytics Service
 * Sends anonymous usage statistics to track active users
 */

import { BaseDirectory, readTextFile, writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { APP_VERSION } from '@/constants/version';

const API_URL = 'https://lorenote.app/api/heartbeat';
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ANALYTICS_FILE = 'analytics.json';

let heartbeatTimer: number | null = null;
let cachedUserId: string | null = null;

/**
 * Get platform information
 */
function getPlatform(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('linux')) return 'linux';
  return 'unknown';
}

/**
 * Generate a persistent anonymous user ID using Tauri file system
 */
async function getOrCreateUserId(): Promise<string> {
  // Return cached ID if available
  if (cachedUserId) {
    return cachedUserId;
  }

  try {
    // Ensure .lorenote directory exists
    const dirExists = await exists('.lorenote', { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir('.lorenote', { baseDir: BaseDirectory.AppData, recursive: true });
    }

    // Try to read existing ID
    const filePath = `.lorenote/${ANALYTICS_FILE}`;
    const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });

    if (fileExists) {
      const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
      const data = JSON.parse(content);
      if (data.userId) {
        cachedUserId = data.userId;
        return data.userId;
      }
    }

    // Generate new ID
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await writeTextFile(filePath, JSON.stringify({ userId: newUserId }), { baseDir: BaseDirectory.AppData });
    cachedUserId = newUserId;
    return newUserId;
  } catch (error) {
    // Fallback: generate a temporary ID if file system fails
    console.debug('Failed to persist analytics ID:', error);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    cachedUserId = tempId;
    return tempId;
  }
}

/**
 * Send heartbeat to server
 */
async function sendHeartbeat(): Promise<void> {
  try {
    const platform = getPlatform();
    const userId = await getOrCreateUserId();

    console.log('[Analytics] Sending heartbeat...', { version: APP_VERSION, platform, userId });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: APP_VERSION,
        platform,
        userId,
      }),
    });

    if (!response.ok) {
      console.warn('[Analytics] Heartbeat failed:', response.status);
    } else {
      console.log('[Analytics] Heartbeat sent successfully');
    }
  } catch (error) {
    // Silently fail - analytics should not affect app functionality
    console.debug('[Analytics] Heartbeat error:', error);
  }
}

/**
 * Start sending periodic heartbeats
 */
export function startAnalytics(): void {
  // Send initial heartbeat
  sendHeartbeat();

  // Set up periodic heartbeats
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  heartbeatTimer = window.setInterval(() => {
    sendHeartbeat();
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop sending heartbeats
 */
export function stopAnalytics(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
