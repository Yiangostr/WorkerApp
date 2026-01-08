import { redisPub, redisSub } from './redis.js';
import { ProgressEventSchema, type ProgressEvent } from './schemas.js';

const PROGRESS_CHANNEL_PREFIX = 'run:progress:';

function getProgressChannel(runId: string): string {
  return `${PROGRESS_CHANNEL_PREFIX}${runId}`;
}

export async function publishProgress(event: ProgressEvent): Promise<void> {
  const channel = getProgressChannel(event.runId);
  const message = JSON.stringify(event);
  await redisPub.publish(channel, message);
}

export async function subscribeToProgress(
  runId: string,
  callback: (event: ProgressEvent) => void
): Promise<() => Promise<void>> {
  const channel = getProgressChannel(runId);

  const messageHandler = (_channel: string, message: string) => {
    try {
      const parsed = JSON.parse(message);
      const event = ProgressEventSchema.parse(parsed);
      callback(event);
    } catch (err) {
      console.error('[PubSub] Failed to parse progress event:', err);
    }
  };

  redisSub.on('message', messageHandler);
  await redisSub.subscribe(channel);

  return async () => {
    redisSub.off('message', messageHandler);
    await redisSub.unsubscribe(channel);
  };
}
