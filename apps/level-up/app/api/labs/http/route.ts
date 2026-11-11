import { z } from 'zod';
import {
  initialSandboxState,
  runSandboxRequest,
  sandboxRequestSchema,
  sandboxStateSchema,
} from '@/lib/labs/http';

const envelope = z
  .object({ request: sandboxRequestSchema, state: sandboxStateSchema.optional() })
  .strict();

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return Response.json({ error: 'Use application/json.' }, { status: 415, headers });
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: 'Request body is required.' }, { status: 400, headers });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 32768) {
        await reader.cancel();
        return Response.json({ error: 'Sandbox payload exceeds 32 KB.' }, { status: 413, headers });
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = envelope.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!parsed.success)
      return Response.json(
        { error: 'Invalid sandbox request or fixture state. Reset and try again.' },
        { status: 400, headers },
      );
    return Response.json(
      runSandboxRequest(parsed.data.request, parsed.data.state ?? initialSandboxState()),
      { headers },
    );
  } catch {
    return Response.json({ error: 'Invalid sandbox JSON.' }, { status: 400, headers });
  } finally {
    reader.releaseLock();
  }
}
