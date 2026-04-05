import Runway from '@runwayml/sdk';

const client = new Runway({
  apiKey: process.env.RUNWAYML_API_SECRET,
  ...(process.env.RUNWAYML_BASE_URL && { baseURL: process.env.RUNWAYML_BASE_URL }),
});

const tools = [
  {
    type: 'client_event',
    name: 'show_emoji',
    description: 'Display an emoji reaction on screen. Call this frequently during conversation to show your emotional reactions — happy, surprised, thinking, laughing, etc.',
    parameters: [
      { name: 'emoji', type: 'string', description: 'A single emoji character representing the reaction' },
      { name: 'label', type: 'string', description: 'A short label for the reaction, e.g. "happy", "surprised", "thinking"' },
    ],
  },
  {
    type: 'client_event',
    name: 'update_topic',
    description: 'Update the displayed conversation topic whenever the subject changes.',
    parameters: [
      { name: 'topic', type: 'string', description: 'Short description of the current conversation topic' },
    ],
  },
];

export async function POST(req: Request) {
  const { avatarId, customAvatarId } = await req.json();

  const avatar = customAvatarId
    ? { type: 'custom' as const, avatarId: customAvatarId }
    : { type: 'runway-preset' as const, presetId: avatarId };

  const isCustom = !!customAvatarId;

  const { id: sessionId } = await client.realtimeSessions.create({
    model: 'gwm1_avatars',
    avatar,
    tools,
    ...(isCustom && {
      personality: 'You are a friendly, expressive conversationalist. Use your tools frequently — show emoji reactions to express your feelings during the conversation, and update the topic whenever the subject changes. Call show_emoji at least once every few sentences.',
      startScript: 'Hey there! Great to see you. What would you like to talk about today?',
    }),
  } as any);

  const session = await pollSessionUntilReady(sessionId);

  return Response.json({ sessionId, sessionKey: session.sessionKey });
}

async function pollSessionUntilReady(sessionId: string) {
  const TIMEOUT_MS = 90_000;
  const POLL_INTERVAL_MS = 2_000;
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const session = await client.realtimeSessions.retrieve(sessionId);
    console.log(`[poll] ${sessionId} status=${session.status} queued=${'queued' in session ? (session as any).queued : '?'}`);

    if (session.status === 'READY') return session;

    if (session.status === 'COMPLETED' || session.status === 'FAILED' || session.status === 'CANCELLED') {
      throw new Error(`Session ${session.status.toLowerCase()} before becoming ready`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Session creation timed out (session ${sessionId} never reached READY)`);
}
