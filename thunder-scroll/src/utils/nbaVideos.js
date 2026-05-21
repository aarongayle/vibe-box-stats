const resolveApiBase = () => {
  const envValue = import.meta.env.VITE_API_BASE;
  const rawValue = typeof envValue === 'string' ? envValue.trim() : '/api';
  return rawValue.replace(/\/$/, '');
};

const API_BASE = resolveApiBase();
const USE_PROXY = API_BASE.length > 0;

const defaultFetchOptions = {
  headers: { 'Cache-Control': 'no-cache' },
  cache: 'no-store',
};

const buildUrl = (path) => {
  if (!USE_PROXY) {
    throw new Error('NBA video features require the API proxy to be enabled.');
  }
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ESPN abbreviations <-> NBA tricodes. ESPN uses shorter forms for several teams
// (e.g. "SA" vs NBA's "SAS"). Map them here so the schedule lookup matches.
const ABBREVIATION_OVERRIDES = {
  SA: 'SAS',
  GS: 'GSW',
  NO: 'NOP',
  UTAH: 'UTA',
  WSH: 'WAS',
  NY: 'NYK',
  SAN: 'SAS',
};

const toNbaTricode = (espnAbbr) => {
  if (!espnAbbr) return '';
  const up = String(espnAbbr).toUpperCase().trim();
  return ABBREVIATION_OVERRIDES[up] || up;
};

const toIsoDateTime = (value) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
};

export async function resolveNbaGameId({ date, homeAbbreviation, awayAbbreviation }) {
  const isoDate = toIsoDateTime(date);
  const home = toNbaTricode(homeAbbreviation);
  const away = toNbaTricode(awayAbbreviation);

  if (!isoDate || !home || !away) return null;

  const url = buildUrl(
    `/nba-game?date=${encodeURIComponent(isoDate)}&home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`
  );

  const response = await fetch(url, defaultFetchOptions);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`NBA game lookup failed (${response.status})`);
  const data = await response.json();
  return data?.gameId ?? null;
}

const nbaClockToSeconds = (clock) => {
  if (!clock || typeof clock !== 'string') return null;
  const match = clock.match(/^PT(\d+)M([\d.]+)S$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + Math.round(seconds);
};

export async function loadNbaPlays(nbaGameId) {
  if (!nbaGameId) return [];
  const url = buildUrl(`/nba-pbp?gameId=${encodeURIComponent(nbaGameId)}`);
  const response = await fetch(url, defaultFetchOptions);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`NBA play-by-play failed (${response.status})`);
  const data = await response.json();
  const actions = data?.game?.actions ?? [];
  return actions.map((action) => ({
    actionNumber: action.actionNumber,
    orderNumber: action.orderNumber,
    period: action.period,
    clock: action.clock,
    clockSeconds: nbaClockToSeconds(action.clock),
    teamTricode: action.teamTricode || null,
    actionType: action.actionType || '',
    subType: action.subType || '',
    description: action.description || '',
    personId: action.personId || null,
    playerName: action.playerName || null,
    isFieldGoal: Boolean(action.isFieldGoal),
  }));
}

// Match an ESPN play to an NBA action by (period, clock seconds, team).
// Falls back through broader buckets if no exact match.
export function indexNbaActions(nbaActions) {
  const byKey = new Map();
  for (const action of nbaActions) {
    if (action.period == null || action.clockSeconds == null) continue;
    const teamKey = action.teamTricode || 'NONE';
    const fullKey = `${action.period}|${action.clockSeconds}|${teamKey}`;
    if (!byKey.has(fullKey)) byKey.set(fullKey, []);
    byKey.get(fullKey).push(action);

    const noTeamKey = `${action.period}|${action.clockSeconds}|*`;
    if (!byKey.has(noTeamKey)) byKey.set(noTeamKey, []);
    byKey.get(noTeamKey).push(action);
  }
  return byKey;
}

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const scoreOverlap = (espnTokens, action) => {
  const actionTokens = tokenize(action.description);
  if (actionTokens.length === 0) return 0;
  let hits = 0;
  for (const token of espnTokens) {
    if (token.length < 3) continue;
    if (actionTokens.includes(token)) hits += 1;
  }
  return hits;
};

export function findNbaActionForPlay(play, indexedActions) {
  if (!play || !indexedActions) return null;
  if (play.period == null || play.clockSeconds == null) return null;

  const teamKey = play.teamAbbreviation || 'NONE';
  const fullKey = `${play.period}|${play.clockSeconds}|${teamKey}`;
  const wildKey = `${play.period}|${play.clockSeconds}|*`;

  let candidates = indexedActions.get(fullKey);
  if (!candidates || candidates.length === 0) {
    candidates = indexedActions.get(wildKey);
  }
  if (!candidates || candidates.length === 0) return null;

  if (candidates.length === 1) return candidates[0];

  // Tie-break by description token overlap, then by smallest orderNumber.
  const espnTokens = tokenize(play.text);
  let best = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const overlap = scoreOverlap(espnTokens, candidate);
    if (overlap > bestScore) {
      best = candidate;
      bestScore = overlap;
    }
  }
  return best ?? candidates[0];
}

const videoCache = new Map();

export async function fetchVideoAsset(nbaGameId, eventId) {
  if (!nbaGameId || eventId == null) return null;
  const key = `${nbaGameId}:${eventId}`;
  if (videoCache.has(key)) return videoCache.get(key);

  const url = buildUrl(
    `/nba-video?gameId=${encodeURIComponent(nbaGameId)}&eventId=${encodeURIComponent(eventId)}`
  );
  const response = await fetch(url, defaultFetchOptions);
  if (response.status === 404) {
    videoCache.set(key, null);
    return null;
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error || '';
    } catch {
      // ignore body parse failure
    }
    throw new Error(detail || `NBA video request failed (${response.status})`);
  }
  const data = await response.json();
  videoCache.set(key, data);
  return data;
}
