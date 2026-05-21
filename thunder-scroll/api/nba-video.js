const STATS_BASE = 'https://stats.nba.com/stats/videoeventsasset';

// Note: function maxDuration is configured via vercel.json (Vercel's plain-JS
// API functions don't honor `export const config` the same way Next.js does).

// Header set matching what the official Python nba_api uses (which is the most
// reliable known fingerprint for stats.nba.com from cloud IPs). Notably:
//   - Referer should be https://stats.nba.com/ (not www.nba.com)
//   - x-nba-stats-origin / x-nba-stats-token are required
//   - Connection: keep-alive
const statsHeaders = {
  Host: 'stats.nba.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.5',
  Referer: 'https://stats.nba.com/',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
  Connection: 'keep-alive',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
};

const pickPlaylistEntry = (data) => {
  const playlist = data?.resultSets?.playlist;
  if (Array.isArray(playlist) && playlist.length > 0) return playlist[0];
  return null;
};

const pickVideoUrls = (data) => {
  const meta = data?.resultSets?.Meta?.videoUrls;
  if (Array.isArray(meta) && meta.length > 0) return meta[0];
  return null;
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

  const { gameId, eventId } = req.query || {};

  if (!gameId || !eventId) {
    res.status(400).json({ error: 'Missing required gameId or eventId parameter' });
    return;
  }

  try {
    const url = `${STATS_BASE}?GameEventID=${encodeURIComponent(eventId)}&GameID=${encodeURIComponent(gameId)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch(url, {
        headers: statsHeaders,
        signal: controller.signal,
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`NBA stats request failed (${response.status})`);
    }

    const data = await response.json();
    const videoUrls = pickVideoUrls(data);
    const entry = pickPlaylistEntry(data);

    if (!videoUrls || !entry) {
      res.status(404).json({ error: 'No video asset available for this play' });
      return;
    }

    const payload = {
      gameId: String(gameId),
      eventId: String(eventId),
      description: entry?.dsc ?? '',
      period: entry?.p ?? null,
      uuid: videoUrls.uuid ?? null,
      large: videoUrls.lurl ?? null,
      medium: videoUrls.murl ?? null,
      small: videoUrls.surl ?? null,
      durationSeconds: videoUrls.dur ?? null,
    };

    if (!payload.large && !payload.medium && !payload.small) {
      res.status(404).json({ error: 'NBA returned an empty asset for this play' });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    res.status(200).json(payload);
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    console.error('NBA video proxy failed', error);
    res.status(aborted ? 504 : 502).json({
      error: aborted
        ? 'NBA stats endpoint timed out'
        : 'Failed to fetch NBA video asset',
    });
  }
}
