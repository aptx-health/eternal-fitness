import { spawn, ChildProcess } from 'child_process';

let emulatorProcess: ChildProcess | null = null;

/**
 * Starts the Pub/Sub emulator
 */
export async function startPubSubEmulator(): Promise<void> {
  const projectId = process.env.PUBSUB_PROJECT_ID || 'test-project';
  const hostPort = process.env.PUBSUB_EMULATOR_HOST || 'localhost:8085';

  console.log('🚀 Starting Pub/Sub emulator...');

  emulatorProcess = spawn('gcloud', [
    'beta',
    'emulators',
    'pubsub',
    'start',
    `--project=${projectId}`,
    `--host-port=${hostPort}`
  ], {
    detached: true,
    stdio: 'ignore' // Don't capture output
  });

  emulatorProcess.unref(); // Allow Node to exit even if emulator is still running

  // Wait for emulator to start (simple fixed delay)
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(`✅ Pub/Sub emulator started on ${hostPort}`);
}

/**
 * Stops the Pub/Sub emulator
 */
export async function stopPubSubEmulator(): Promise<void> {
  if (emulatorProcess) {
    console.log('🛑 Stopping Pub/Sub emulator...');
    emulatorProcess.kill('SIGTERM');

    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Force kill if still running
    if (!emulatorProcess.killed) {
      emulatorProcess.kill('SIGKILL');
    }

    emulatorProcess = null;
    console.log('✅ Pub/Sub emulator stopped');
  }
}
