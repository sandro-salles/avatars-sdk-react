import { queueSpeech, snapshot } from '@/lib/response-store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { sessionId: string; speech: string };
    if (!body.sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const state = queueSpeech(body.sessionId, body.speech ?? '');
    return Response.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    return Response.json({ error: 'sessionId is required' }, { status: 400 });
  }
  return Response.json(snapshot(sessionId));
}
