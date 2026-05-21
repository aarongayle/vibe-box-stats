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

// ESPN's competition.date is the actual tip-off in UTC (e.g. 2026-05-21T00:30:00Z).
// NBA's schedule exposes both a date-only field (gameDateUTC, e.g. 2026-05-20T04:00:00Z
// which represents "May 20 Eastern") AND an actual tip-off time (gameDateTimeUTC, e.g.
// 2026-05-21T00:30:00Z). To handle both Eastern-game-date and UTC-tipoff representations,
// we accept a match if the target ISO date is within ~24h of any of the candidate fields.
const MATCH_WINDOW_MS = 18 * 60 * 60 * 1000;

// Returns the tightest tip-off mismatch (ms) between an NBA schedule entry and the
// target ISO date. ESPN's competition.date is the tip-off UTC; NBA exposes that as
// gameDateTimeUTC and also a date-only field (gameDateUTC) shifted to Eastern.
// We try multiple candidate fields and pick the smallest absolute delta.
const tipoffDeltaMs = (game, targetIso) => {
  if (!targetIso) return Infinity;
  const targetMs = Date.parse(targetIso);
  if (Number.isNaN(targetMs)) return Infinity;

  const candidates = [
    game?.gameDateTimeUTC,
    game?.gameDateTimeEst,
    game?.gameDateUTC,
    game?.gameDateEst,
  ].filter(Boolean);

  let best = Infinity;
  for (const candidate of candidates) {
    const candidateMs = Date.parse(candidate);
    if (Number.isNaN(candidateMs)) continue;
    const delta = Math.abs(candidateMs - targetMs);
    if (delta < best) best = delta;
  }
  return best;
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
    let bestDelta = Infinity;

    for (const day of gameDates) {
      const dayGames = day?.games ?? [];
      for (const game of dayGames) {
        const homeTri = normalizeTri(game?.homeTeam?.teamTricode);
        const awayTri = normalizeTri(game?.awayTeam?.teamTricode);
        if (homeTri !== targetHome || awayTri !== targetAway) continue;
        const delta = tipoffDeltaMs(game, date);
        if (delta > MATCH_WINDOW_MS) continue;
        if (delta < bestDelta) {
          match = game;
          bestDelta = delta;
        }
      }
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
