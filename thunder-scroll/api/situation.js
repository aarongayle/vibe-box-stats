const CORE_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba';

const defaultHeaders = {
  'Cache-Control': 'no-cache',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { gameId } = req.query || {};

  if (!gameId) {
    res.status(400).json({ error: 'Missing required gameId parameter' });
    return;
  }

  try {
    const situationUrl = `${CORE_BASE_URL}/events/${encodeURIComponent(gameId)}/competitions/${encodeURIComponent(
      gameId
    )}/situation?lang=en&region=us`;
    const response = await fetch(situationUrl, {
      headers: defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(`ESPN situation request failed (${response.status})`);
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    res.status(200).json(data);
  } catch (error) {
    console.error('Situation proxy failed', error);
    res.status(502).json({ error: 'Failed to fetch in-game situation data' });
  }
}

