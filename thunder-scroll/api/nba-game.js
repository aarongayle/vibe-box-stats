const SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';

const browserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
};

let cachedSchedule = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;

async function loadSchedule() {
  const now = Date.now();
  if (cachedSchedule && now - cachedAt < CACHE_TTL_MS) {
    return cachedSchedule;
  }
  const response = await fetch(SCHEDULE_URL, { headers: browserHeaders });
  if (!response.ok) {
    throw new Error(`NBA schedule request failed (${response.status})`);
  }
  const data = await response.json();
  cachedSchedule = data;
  cachedAt = now;
  return data;
}

const normalizeTri = (value) => (value ? String(value).toUpperCase().trim() : '');

const sameDay = (gameDateUtc, targetIso) => {
  if (!gameDateUtc || !targetIso) return false;
  return gameDateUtc.slice(0, 10) === targetIso.slice(0, 10);
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

  const { date, home, away } = req.query || {};

  if (!date || !home || !away) {
    res.status(400).json({ error: 'Missing required date, home, or away parameter' });
    return;
  }

  const targetHome = normalizeTri(home);
  const targetAway = normalizeTri(away);

  try {
    const schedule = await loadSchedule();
    const gameDates = schedule?.leagueSchedule?.gameDates ?? [];

    let match = null;

    for (const day of gameDates) {
      const dayGames = day?.games ?? [];
      for (const game of dayGames) {
        const gameDateUtc = game?.gameDateUTC || game?.gameDateTimeUTC || game?.gameDateEst;
        if (!sameDay(gameDateUtc, date)) continue;
        const homeTri = normalizeTri(game?.homeTeam?.teamTricode);
        const awayTri = normalizeTri(game?.awayTeam?.teamTricode);
        if (homeTri === targetHome && awayTri === targetAway) {
          match = game;
          break;
        }
      }
      if (match) break;
    }

    if (!match) {
      res.status(404).json({ error: 'No NBA game found for the given date/teams' });
      return;
    }

    const payload = {
      gameId: match.gameId,
      gameCode: match.gameCode,
      gameDateUTC: match.gameDateUTC,
      gameStatus: match.gameStatus,
      homeTeam: {
        tricode: match.homeTeam?.teamTricode,
        teamId: match.homeTeam?.teamId,
        name: match.homeTeam?.teamName,
      },
      awayTeam: {
        tricode: match.awayTeam?.teamTricode,
        teamId: match.awayTeam?.teamId,
        name: match.awayTeam?.teamName,
      },
    };

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
    res.status(200).json(payload);
  } catch (error) {
    console.error('NBA game lookup failed', error);
    res.status(502).json({ error: 'Failed to look up NBA game id' });
  }
}
