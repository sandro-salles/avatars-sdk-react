import Runway from '@runwayml/sdk';
import type { RealtimeSessionCreateParams } from '@runwayml/sdk/resources/realtime-sessions';
import { createRpcHandler, type RpcHandler } from '@runwayml/avatars-node-rpc';
import { getWeather } from '@/lib/weather-database';
import { WEATHER_PERSONALITY, WEATHER_START_SCRIPT } from '@/lib/personality';

const client = new Runway();

const activeHandlers = new Map<string, RpcHandler>();

const rpcTools: RealtimeSessionCreateParams['tools'] = [
  {
    type: 'backend_rpc',
    name: 'get_weather',
    description: 'Get current weather conditions for a city. Returns temperature, conditions, humidity, wind speed, and daily high/low.',
    parameters: [
      { name: 'city', type: 'string', description: 'City name (e.g. "New York", "Tokyo")' },
    ],
    timeoutSeconds: 5,
  },
];

export async function POST(req: Request) {
  try {
    const { avatarId } = (await req.json()) as { avatarId: string };

    const { id: sessionId } = await client.realtimeSessions.create({
      model: 'gwm1_avatars',
      avatar: { type: 'custom', avatarId },
      tools: rpcTools,
      personality: WEATHER_PERSONALITY,
      startScript: WEATHER_START_SCRIPT,
    });

    const session = await pollSessionUntilReady(sessionId);

    const handler = await createRpcHandler({
      apiKey: process.env.RUNWAYML_API_SECRET!,
      sessionId,
      tools: {
        async get_weather(args) {
          const city = typeof args.city === 'string' ? args.city : 'unknown';
          return getWeather(city);
        },
      },
      onDisconnected: () => activeHandlers.delete(sessionId),
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

    if (session.status === 'COMPLETED' || session.status === 'FAILED' || session.status === 'CANCELLED') {
      throw new Error(`Session ${session.status.toLowerCase()} before becoming ready`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Session creation timed out');
}
