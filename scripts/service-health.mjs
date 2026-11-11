import { services as projects } from '../shared/services.mjs';

export function boundServiceUrl(project, environment) {
  const value = environment[project.binding];
  if (!value) return null;
  const base = new URL(value);
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Unsupported service binding protocol.');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  return new URL(project.healthPath.replace(/^\//, ''), base);
}

export async function checkServices(environment, request = fetch) {
  return Promise.all(projects.map(async project => {
    try {
      const url = boundServiceUrl(project, environment);
      if (!url) return { id: project.id, ready: false };
      const response = await request(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      await response.body?.cancel();
      return { id: project.id, ready: response.ok };
    } catch { return { id: project.id, ready: false }; }
  }));
}
