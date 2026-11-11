// Names and public paths are shared by build tools and the runtime health check.
// Binding values themselves are supplied by Vercel only at request time.
const bindings = {
  'sloth-ai': 'SLOTH_AI_URL',
  'visio-generator': 'VISIO_GENERATOR_URL',
  'overtimer': 'OVERTIMER_URL',
  'level-up': 'LEVEL_UP_URL',
};
export const services = ['sloth-ai', 'visio-generator', 'overtimer', 'level-up'].map(id => ({
  id,
  basePath: `/tools/${id}`,
  binding: bindings[id],
  healthPath: id === 'level-up' ? `/tools/${id}/en` : `/tools/${id}`,
}));
