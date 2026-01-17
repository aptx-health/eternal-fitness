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

export function getPowerSync(): PowerSyncDatabase {
  if (powerSyncInstance) {
    console.log('[PowerSync DB] Returning existing instance');
    return powerSyncInstance;
  }

  console.log('[PowerSync DB] Creating new PowerSync instance');

  // Initialize PowerSync database
  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'fitcsv-local.db', // Stored in IndexedDB
    },
  });

  console.log('[PowerSync DB] PowerSync instance created, connecting to Supabase');

  // Connect to Supabase via PowerSync
  const connector = new SupabaseConnector();
  powerSyncInstance.connect(connector);

  console.log('[PowerSync DB] Connection initiated');

  return powerSyncInstance;
}

// Export singleton instance
export const powerSync = getPowerSync();
