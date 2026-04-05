import Runway from '@runwayml/sdk';
import { clientEventTools } from '@/lib/avatar-tools';
import {
  DEFAULT_TRIVIA_PERSONALITY,
  DEFAULT_TRIVIA_START_SCRIPT,
} from '@/lib/trivia-personality';

const client = new Runway({ apiKey: process.env.RUNWAYML_API_SECRET });

/** Trivia `personality` / `startScript` and `tools` come from `lib/trivia-personality.ts` and `lib/avatar-tools.ts`. */
export async function POST(req: Request) {
  try {
    const { avatarId } = await req.json() as { avatarId: string };

    const { id: sessionId } = await client.realtimeSessions.create({
      model: 'gwm1_avatars',
      avatar: { type: 'custom' as const, avatarId },
      tools: clientEventTools,
      personality: DEFAULT_TRIVIA_PERSONALITY,
      startScript: DEFAULT_TRIVIA_START_SCRIPT,
    });

    const session = await pollSessionUntilReady(sessionId);

    return Response.json({ sessionId, sessionKey: session.sessionKey });
  } catch (error) {
    console.error('[connect] Failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

async function pollSessionUntilReady(sessionId: string) {
  const TIMEOUT_MS = 30_000;
  const POLL_INTERVAL_MS = 1_000;
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const session = await client.realtimeSessions.retrieve(sessionId);

    if (session.status === 'READY') return session;

    if (session.status === 'COMPLETED' || session.status === 'FAILED' || session.status === 'CANCELLED') {
      throw new Error(`Session ${session.status.toLowerCase()} before becoming ready`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Session creation timed out');
}
