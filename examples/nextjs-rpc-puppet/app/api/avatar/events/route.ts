import { subscribeToSession } from '@/lib/response-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: 'connected', sessionId, time: new Date().toISOString() });

      const unsubscribe = subscribeToSession(sessionId, (event) => send(event));

      req.signal.addEventListener(
        'abort',
        () => {
          unsubscribe();
          controller.close();
        },
        { once: true },
      );
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
