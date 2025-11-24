const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

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
    const summaryUrl = `${BASE_URL}/summary?event=${encodeURIComponent(gameId)}`;
    const response = await fetch(summaryUrl, {
      headers: defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(`ESPN summary request failed (${response.status})`);
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    res.status(200).json(data);
  } catch (error) {
    console.error('Summary proxy failed', error);
    res.status(502).json({ error: 'Failed to fetch game summary data' });
  }
}
