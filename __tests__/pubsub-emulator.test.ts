/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { PubSub } from '@google-cloud/pubsub';

describe('Pub/Sub Emulator - Hello World', () => {
  it('should publish and receive a message', async () => {
    // Create client - automatically uses PUBSUB_EMULATOR_HOST from environment
    const pubsub = new PubSub({
      projectId: process.env.PUBSUB_PROJECT_ID || 'test-project'
    });

    const topicName = 'test-topic-' + Date.now();
    const subscriptionName = 'test-sub-' + Date.now();

    // Create topic
    const [topic] = await pubsub.createTopic(topicName);

    // Create subscription
    const [subscription] = await topic.createSubscription(subscriptionName);

    // Set up listener
    let receivedMessage: string | null = null;
    subscription.on('message', (message) => {
      receivedMessage = message.data.toString();
      message.ack();
    });

    // Publish message
    const messageId = await topic.publishMessage({
      data: Buffer.from('Hello from test!')
    });

    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Assert
    expect(receivedMessage).toBe('Hello from test!');

    // Cleanup
    await subscription.delete();
    await topic.delete();
  }, 10000); // 10 second timeout
});
