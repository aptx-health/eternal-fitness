import { startPubSubEmulator, stopPubSubEmulator } from './pubsub-emulator';

/**
 * Global setup - runs once before all test files
 */
export async function setup() {
  console.log('🌍 Global test setup starting...');

  // Start Pub/Sub emulator if PUBSUB_EMULATOR_HOST is set
  if (process.env.PUBSUB_EMULATOR_HOST) {
    await startPubSubEmulator();
  }

  console.log('✅ Global test setup complete');
}

/**
 * Global teardown - runs once after all test files
 */
export async function teardown() {
  console.log('🌍 Global test teardown starting...');

  // Stop Pub/Sub emulator
  await stopPubSubEmulator();

  console.log('✅ Global test teardown complete');
}
