const CDN_BASE = 'https://cdn.nba.com/static/json/liveData/playbyplay';

const browserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
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

  if (!gameId || !/^\d{10}$/.test(String(gameId))) {
    res.status(400).json({ error: 'Missing or malformed gameId (expected 10-digit NBA gameId)' });
    return;
  }

  try {
    const url = `${CDN_BASE}/playbyplay_${gameId}.json`;
    const response = await fetch(url, { headers: browserHeaders });

    if (response.status === 404) {
      res.status(404).json({ error: 'NBA play-by-play not found for this gameId' });
      return;
    }

    if (!response.ok) {
      throw new Error(`NBA pbp request failed (${response.status})`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    res.status(200).json(data);
  } catch (error) {
    console.error('NBA pbp proxy failed', error);
    res.status(502).json({ error: 'Failed to fetch NBA play-by-play data' });
  }
}
