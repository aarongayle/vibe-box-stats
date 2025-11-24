const TEAM_ID = '25';
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

  try {
    const response = await fetch(`${BASE_URL}/teams/${TEAM_ID}/schedule`, {
      headers: defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(`ESPN schedule request failed (${response.status})`);
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    res.status(200).json(data);
  } catch (error) {
    console.error('Schedule proxy failed', error);
    res.status(502).json({ error: 'Failed to fetch schedule data' });
  }
}
