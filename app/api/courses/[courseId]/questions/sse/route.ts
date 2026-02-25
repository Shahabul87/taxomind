import { NextRequest, NextResponse } from 'next/server';
import { qaEventBus } from '@/lib/realtime/event-bus';
import { currentUser } from '@/lib/auth';

interface RouteParams { params: Promise<{ courseId: string }>; }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await currentUser();
  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { courseId } = await params;

  let keepAlive: any;
  let unsub: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      unsub = qaEventBus.onCourse(courseId, (e) => send(e));
      send({ type: 'connected', courseId });
      keepAlive = setInterval(() => controller.enqueue(encoder.encode(': keep-alive\n\n')), 25000);

      const cleanup = () => {
        try { if (keepAlive) clearInterval(keepAlive); } catch {}
        try { if (unsub) unsub(); } catch {}
        try { controller.close(); } catch {}
      };

      // Abort on client disconnect if available
      try {
        // @ts-ignore
        const signal: AbortSignal | undefined = (request as any).signal;
        signal?.addEventListener('abort', cleanup);
      } catch {}

      // Expose cleanup for cancel
      // @ts-ignore
      (controller as any)._cleanup = cleanup;
    },
    cancel(reason) {
      // @ts-ignore
      const cleanup = (this as any)?.start?.cleanup || (this as any)?._cleanup;
      if (typeof cleanup === 'function') cleanup();
      try { if (keepAlive) clearInterval(keepAlive); } catch {}
      try { if (unsub) unsub(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
