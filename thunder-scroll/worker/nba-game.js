import { browserHeaders, json } from './http.js';

const SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';

let cachedSchedule = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;

async function loadSchedule() {
  const now = Date.now();
  if (cachedSchedule && now - cachedAt < CACHE_TTL_MS) {
    return cachedSchedule;
  }
  const response = await fetch(SCHEDULE_URL, {
    headers: browserHeaders,
    cf: { cacheTtl: 1800, cacheEverything: true },
  });
  if (!response.ok) {
    throw new Error(`NBA schedule request failed (${response.status})`);
  }
  const data = await response.json();
  cachedSchedule = data;
  cachedAt = now;
  return data;
}

const normalizeTri = (value) => (value ? String(value).toUpperCase().trim() : '');

// ESPN abbreviations sometimes differ from NBA tricodes (e.g. "SA" vs "SAS").
// Accept a tricode match if any of: exact match, known alias, or a prefix
// relationship (ESPN's short code is a prefix of the NBA tricode, or vice versa).
const TRI_ALIASES = {
  SA: 'SAS',
  GS: 'GSW',
  NO: 'NOP',
  UTAH: 'UTA',
  WSH: 'WAS',
  NY: 'NYK',
  SAN: 'SAS',
};

const matchesTricode = (candidate, target) => {
  if (!candidate || !target) return false;
  const c = normalizeTri(candidate);
  const t = normalizeTri(target);
  if (c === t) return true;
  if (TRI_ALIASES[t] === c) return true;
  if (TRI_ALIASES[c] === t) return true;
  if (t.length >= 2 && c.startsWith(t)) return true;
  if (c.length >= 2 && t.startsWith(c)) return true;
  return false;
};

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

export default async function nbaGame(params) {
  const date = params.get('date');
  const home = params.get('home');
  const away = params.get('away');

  if (!date || !home || !away) {
    return json({ error: 'Missing required date, home, or away parameter' }, 400);
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
        if (!matchesTricode(game?.homeTeam?.teamTricode, targetHome)) continue;
        if (!matchesTricode(game?.awayTeam?.teamTricode, targetAway)) continue;
        const delta = tipoffDeltaMs(game, date);
        if (delta > MATCH_WINDOW_MS) continue;
        if (delta < bestDelta) {
          match = game;
          bestDelta = delta;
        }
      }
    }

    if (!match) {
      return json({ error: 'No NBA game found for the given date/teams' }, 404);
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

    return json(payload, 200, 'public, max-age=3600');
  } catch (error) {
    console.error('NBA game lookup failed', error);
    return json({ error: 'Failed to look up NBA game id' }, 502);
  }
}
