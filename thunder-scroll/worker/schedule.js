import { json, passThrough } from './http.js';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

export default async function schedule(params) {
  const teamId = params.get('teamId');

  if (!teamId) {
    return json({ error: 'Missing required teamId parameter' }, 400);
  }

  try {
    const response = await fetch(`${BASE_URL}/teams/${encodeURIComponent(teamId)}/schedule`, {
      cf: { cacheTtl: 120, cacheEverything: true },
    });

    if (!response.ok) {
      throw new Error(`ESPN schedule request failed (${response.status})`);
    }

    return passThrough(response, 'public, max-age=60');
  } catch (error) {
    console.error('Schedule proxy failed', error);
    return json({ error: 'Failed to fetch schedule data' }, 502);
  }
}
