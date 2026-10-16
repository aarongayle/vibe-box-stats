// Cloudflare Worker for the /api/* routes (run_worker_first in wrangler.jsonc).
// Everything else is the Vite build in dist/, served as static assets.
import nbaGame from './nba-game.js';
import nbaPbp from './nba-pbp.js';
import schedule from './schedule.js';
import summary from './summary.js';
import { json, preflight } from './http.js';

const routes = {
  '/api/schedule': schedule,
  '/api/summary': summary,
  '/api/nba-game': nbaGame,
  '/api/nba-pbp': nbaPbp,
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const route = routes[url.pathname];
    if (!route) return json({ error: 'Not Found' }, 404);

    const early = preflight(request);
    if (early) return early;

    return route(url.searchParams);
  },
};
