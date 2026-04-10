import Runway from '@runwayml/sdk';
import { createRpcHandler, type RpcHandler } from '@runwayml/avatars-node-rpc';
import { backendRpcTools } from '@/lib/avatar-tools';
import { cleanupSession, consumeSpeech, initializeSession } from '@/lib/response-store';
import { PUPPET_PERSONALITY, PUPPET_START_SCRIPT } from '@/lib/personality';

export const runtime = 'nodejs';

const client = new Runway();
const activeHandlers = new Map<string, RpcHandler>();

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      avatarId: string;
      openingSpeech?: string;
    };

    const { id: sessionId } = await client.realtimeSessions.create({
      model: 'gwm1_avatars',
      avatar: { type: 'custom', avatarId: body.avatarId },
      tools: backendRpcTools,
      personality: PUPPET_PERSONALITY,
      startScript: PUPPET_START_SCRIPT,
    });

    initializeSession(sessionId, body.openingSpeech);

    const session = await pollSessionUntilReady(sessionId);

    const handler = await createRpcHandler({
      apiKey: process.env.RUNWAYML_API_SECRET!,
      sessionId,
      tools: {
        async get_response(args) {
          const result = consumeSpeech(sessionId, args);
          console.log('[rpc:get_response]', { sessionId, args, result });
          return result;
        },
      },
      onDisconnected: () => {
        activeHandlers.delete(sessionId);
        cleanupSession(sessionId);
      },
      onError: (error: Error) => console.error('[rpc] Handler error:', error.message),
    });

    activeHandlers.set(sessionId, handler);

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

    if (
      session.status === 'COMPLETED' ||
      session.status === 'FAILED' ||
      session.status === 'CANCELLED'
    ) {
      throw new Error(`Session ${session.status.toLowerCase()} before becoming ready`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Session creation timed out');
}
