import { json, passThrough } from './http.js';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

export default async function summary(params) {
  const gameId = params.get('gameId');

  if (!gameId) {
    return json({ error: 'Missing required gameId parameter' }, 400);
  }

  try {
    const response = await fetch(`${BASE_URL}/summary?event=${encodeURIComponent(gameId)}`, {
      // Short edge cache: the page polls live games every 30 seconds.
      cf: { cacheTtl: 10, cacheEverything: true },
    });

    if (!response.ok) {
      throw new Error(`ESPN summary request failed (${response.status})`);
    }

    return passThrough(response, 'no-cache');
  } catch (error) {
    console.error('Summary proxy failed', error);
    return json({ error: 'Failed to fetch game summary data' }, 502);
  }
}
