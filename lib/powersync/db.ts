import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './schema';
import { SupabaseConnector } from './SupabaseConnector';

/**
 * PowerSync database singleton
 *
 * Provides local SQLite database that syncs bidirectionally with Supabase.
 * Database is stored in IndexedDB as 'fitcsv-local.db'.
 *
 * Usage:
 * ```typescript
 * import { powerSync } from '@/lib/powersync/db'
 *
 * // Query data
 * const programs = await powerSync.getAll('SELECT * FROM Program WHERE userId = ?', [userId])
 *
 * // Watch for changes (reactive)
 * for await (const result of powerSync.watch('SELECT * FROM Program WHERE userId = ?', [userId])) {
 *   console.log('Programs updated:', result.rows)
 * }
 * ```
 */

let powerSyncInstance: PowerSyncDatabase | null = null;

/**
 * Detect if running on mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if IndexedDB is available (fails in iOS Safari private mode)
 */
async function checkIndexedDBAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.indexedDB) return false;

  try {
    const testDB = 'powersync-test';
    const request = indexedDB.open(testDB);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        indexedDB.deleteDatabase(testDB);
        resolve(true);
      };
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export function getPowerSync(): PowerSyncDatabase {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    throw new Error('PowerSync can only be used in the browser');
  }

  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  const mobile = isMobileDevice();
  console.log('[PowerSync DB] Initializing PowerSync', {
    mobile,
    userAgent: navigator.userAgent
  });

  // Initialize PowerSync database with modern constructor API
  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'fitcsv-local.db',
    },
    sync: {
      // Point to worker in public directory (copied via npx powersync-web copy-assets)
      worker: '/@powersync/worker/WASQLiteDB.umd.js',
    },
    flags: {
      // Disable web workers to fix Chrome stalling issue and improve mobile compatibility
      // See: https://docs.powersync.com/resources/troubleshooting
      useWebWorker: false,
      // Disable SSR warning since we're only on client
      disableSSRWarning: true,
    },
  });

  // Connect to Supabase via PowerSync
  const connector = new SupabaseConnector();
  powerSyncInstance.connect(connector);

  console.log('[PowerSync DB] Connection initiated');

  return powerSyncInstance;
}

// Lazy initialization - only create when first accessed on client
let _powerSyncClient: PowerSyncDatabase | null = null;

export const powerSync = new Proxy({} as PowerSyncDatabase, {
  get(target, prop) {
    if (!_powerSyncClient) {
      _powerSyncClient = getPowerSync();
    }
    return (_powerSyncClient as any)[prop];
  },
});

/**
 * Wait for PowerSync to complete initial sync before querying data.
 *
 * This ensures data is available in local database before running queries.
 * Shows sync progress and handles mobile-specific initialization issues.
 *
 * @param onProgress - Optional callback for sync progress updates
 * @param timeoutMs - Max time to wait for sync (default: 30s)
 * @returns Promise that resolves when initial sync completes
 * @throws Error if sync fails or times out
 */
export async function waitForInitialSync(
  onProgress?: (message: string) => void,
  timeoutMs: number = 30000
): Promise<void> {
  const startTime = Date.now();
  const mobile = isMobileDevice();

  try {
    // Check for IndexedDB availability (required for PowerSync)
    const idbAvailable = await checkIndexedDBAvailable();
    if (!idbAvailable) {
      throw new Error(
        mobile
          ? 'Local storage unavailable. If in private/incognito mode, please use normal mode.'
          : 'Local storage (IndexedDB) is not available in your browser.'
      );
    }

    // Step 1: Wait for database to be ready (connection established)
    onProgress?.('Connecting to database...');
    console.log('[PowerSync] Waiting for database connection...', { mobile });

    const connectionTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );

    await Promise.race([powerSync.waitForReady(), connectionTimeout]);
    console.log('[PowerSync] Database connected');

    // Step 2: Wait for initial sync to complete
    onProgress?.('Syncing data...');
    console.log('[PowerSync] Waiting for initial sync...');

    // Poll for hasSynced status
    while (!powerSync.currentStatus?.hasSynced) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Initial sync timeout - data may not be available');
      }

      // Check if we're connected (might have disconnected)
      if (!powerSync.connected) {
        throw new Error('PowerSync disconnected during initial sync');
      }

      // Log progress
      const status = powerSync.currentStatus;
      if (status?.lastSyncedAt) {
        console.log('[PowerSync] Sync in progress...', {
          lastSyncedAt: status.lastSyncedAt,
          hasSynced: status.hasSynced,
        });
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[PowerSync] Initial sync completed in ${elapsedMs}ms`);
    onProgress?.('Sync complete');

  } catch (error) {
    console.error('[PowerSync] Initialization failed:', error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error(
          'Sync is taking longer than expected. Check your network connection and try again.'
        );
      } else if (error.message.includes('disconnected')) {
        throw new Error(
          'Lost connection during sync. Check your network and try again.'
        );
      }
    }

    throw error;
  }
}
