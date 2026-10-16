import { browserHeaders, json, passThrough } from './http.js';

const CDN_BASE = 'https://cdn.nba.com/static/json/liveData/playbyplay';

export default async function nbaPbp(params) {
  const gameId = params.get('gameId');

  if (!gameId || !/^\d{10}$/.test(gameId)) {
    return json({ error: 'Missing or malformed gameId (expected 10-digit NBA gameId)' }, 400);
  }

  try {
    const response = await fetch(`${CDN_BASE}/playbyplay_${gameId}.json`, {
      headers: browserHeaders,
      cf: { cacheTtl: 30, cacheEverything: true },
    });

    if (response.status === 404) {
      return json({ error: 'NBA play-by-play not found for this gameId' }, 404);
    }

    if (!response.ok) {
      throw new Error(`NBA pbp request failed (${response.status})`);
    }

    return passThrough(response, 'public, max-age=15');
  } catch (error) {
    console.error('NBA pbp proxy failed', error);
    return json({ error: 'Failed to fetch NBA play-by-play data' }, 502);
  }
}
