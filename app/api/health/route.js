import { checkServices } from '../../../scripts/service-health.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Bindings exist only in runtime functions, never during build or middleware.
  const apps = await checkServices(process.env);
  return Response.json({ apps }, {
    status: apps.every(app => app.ready) ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
