export const TEAM_ID = '25';
const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

const defaultFetchOptions = {
  cache: 'no-store',
};

const pickLogo = (team) => {
  if (!team) return '';
  if (team.logos?.length) return team.logos[0].href;
  return team.logo || '';
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseMinutesValue = (value) => {
  if (!value) return 0;
  if (value.includes(':')) {
    const [minutes, seconds] = value.split(':').map((part) => Number(part));
    const base = Number.isFinite(minutes) ? minutes : 0;
    const extra = Number.isFinite(seconds) ? seconds / 60 : 0;
    return base + extra;
  }
  return Number(value) || 0;
};

const getRecordSummary = (competitor) => {
  const records = competitor?.record || competitor?.records;
  if (!Array.isArray(records)) return null;
  const preferred = records.find((entry) => entry.type === 'total' || entry.abbreviation === 'YTD');
  return preferred?.displayValue || records[0]?.displayValue || null;
};

const httpGet = async (url) => {
  const response = await fetch(url, defaultFetchOptions);
  if (!response.ok) {
    throw new Error(`ESPN request failed (${response.status})`);
  }
  return response.json();
};

const normalizeScheduleEvent = (event) => {
  const competition = event?.competitions?.[0];
  const status = competition?.status?.type ?? competition?.status ?? event?.status?.type ?? {};
  const competitors = competition?.competitors ?? [];
  const thunder = competitors.find((team) => team.id === TEAM_ID || team.team?.id === TEAM_ID);
  const opponent = competitors.find((team) => team.id !== TEAM_ID && team.team?.id !== TEAM_ID);

  const thunderTeam = thunder?.team ?? thunder;
  const opponentTeam = opponent?.team ?? opponent;

  const thunderScore = toNumber(thunder?.score?.value ?? thunder?.score?.displayValue ?? thunder?.score);
  const opponentScore = toNumber(opponent?.score?.value ?? opponent?.score?.displayValue ?? opponent?.score);

  const result =
    status.state === 'post' && thunderScore !== null && opponentScore !== null
      ? thunderScore > opponentScore
        ? 'W'
        : 'L'
      : null;

  return {
    id: event?.id,
    date: event?.date,
    venue: competition?.venue?.fullName ?? '',
    status: {
      state: status?.state,
      detail: status?.detail ?? '',
      shortDetail: status?.shortDetail ?? '',
      description: competition?.status?.type?.description ?? status?.description ?? '',
      completed: Boolean(status?.completed),
      displayClock: competition?.status?.displayClock ?? '',
      period: competition?.status?.period ?? 0,
    },
    isHome: thunder?.homeAway === 'home',
    thunderScore,
    opponentScore,
    result,
    scoreline: thunderScore !== null && opponentScore !== null ? `${thunderScore} - ${opponentScore}` : null,
    opponent: opponent
      ? {
          name: opponentTeam?.displayName ?? opponentTeam?.name ?? 'Opponent',
          shortName: opponentTeam?.shortDisplayName ?? opponentTeam?.abbreviation ?? opponentTeam?.name ?? 'OPP',
          abbreviation: opponentTeam?.abbreviation ?? opponentTeam?.shortDisplayName ?? 'OPP',
          logo: pickLogo(opponentTeam),
          record: getRecordSummary(opponent),
        }
      : null,
  };
};

const parsePlayers = (boxscorePlayers = []) => {
  const thunderSection = boxscorePlayers.find((team) => team.team?.id === TEAM_ID);
  if (!thunderSection) return [];

  const statTable = thunderSection.statistics?.find((stat) => Array.isArray(stat.athletes));
  if (!statTable) return [];

  const keyIndex = statTable.keys?.reduce((acc, key, index) => {
    acc[key] = index;
    return acc;
  }, {}) ?? {};

  const minutesIdx = keyIndex.minutes;
  const pointsIdx = keyIndex.points;
  const reboundsIdx = keyIndex.rebounds;
  const assistsIdx = keyIndex.assists;
  const plusMinusIdx = keyIndex.plusMinus;

  return (
    statTable.athletes
      ?.map((row) => {
        const stats = row.stats ?? [];
        const minutesDisplay = minutesIdx !== undefined ? stats[minutesIdx] : '0';
        const minutesValue = parseMinutesValue(minutesDisplay);
        if (minutesValue === 0 || row.didNotPlay) return null;

        const athlete = row.athlete ?? {};
        const lastName =
          athlete.lastName ??
          (athlete.displayName ? athlete.displayName.split(' ').slice(-1)[0] : athlete.shortName ?? 'Player');

        return {
          id: athlete.id ?? lastName,
          name: lastName,
          minutes: minutesDisplay,
          minutesValue,
          points: pointsIdx !== undefined ? Number(stats[pointsIdx]) || 0 : 0,
          rebounds: reboundsIdx !== undefined ? Number(stats[reboundsIdx]) || 0 : 0,
          assists: assistsIdx !== undefined ? Number(stats[assistsIdx]) || 0 : 0,
          plusMinus: plusMinusIdx !== undefined ? stats[plusMinusIdx] ?? '0' : '0',
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.minutesValue !== a.minutesValue) return b.minutesValue - a.minutesValue;
        return b.points - a.points;
      }) ?? []
  );
};

export async function fetchSchedule() {
  const data = await httpGet(`${BASE_URL}/teams/${TEAM_ID}/schedule`);
  return (data?.events ?? []).map(normalizeScheduleEvent);
}

export async function fetchGameSummary(gameId) {
  const data = await httpGet(`${BASE_URL}/summary?event=${gameId}`);
  const competition = data?.header?.competitions?.[0];

  if (!competition) {
    return null;
  }

  const status = competition.status?.type ?? competition.status ?? {};
  const competitors = competition.competitors ?? [];
  const thunder = competitors.find((team) => team.id === TEAM_ID || team.team?.id === TEAM_ID);
  const opponent = competitors.find((team) => team.id !== TEAM_ID && team.team?.id !== TEAM_ID);
  const thunderTeam = thunder?.team ?? thunder;
  const opponentTeam = opponent?.team ?? opponent;

  return {
    gameId,
    status: {
      state: status.state,
      detail: status.detail ?? '',
      shortDetail: status.shortDetail ?? '',
      description: status.description ?? '',
      completed: Boolean(status.completed),
      displayClock: competition.status?.displayClock ?? '',
      period: competition.status?.period ?? 0,
    },
    thunder: {
      score: toNumber(thunder?.score?.value ?? thunder?.score?.displayValue ?? thunder?.score),
      record: getRecordSummary(thunder),
    },
    opponent: opponent
      ? {
          name: opponentTeam?.displayName ?? opponentTeam?.name ?? 'Opponent',
          shortName: opponentTeam?.shortDisplayName ?? opponentTeam?.abbreviation ?? opponentTeam?.name ?? 'OPP',
          abbreviation: opponentTeam?.abbreviation ?? opponentTeam?.shortDisplayName ?? 'OPP',
          logo: pickLogo(opponentTeam),
          score: toNumber(opponent?.score?.value ?? opponent?.score?.displayValue ?? opponent?.score),
          record: getRecordSummary(opponent),
        }
      : null,
    players: parsePlayers(data?.boxscore?.players),
    fetchedAt: new Date().toISOString(),
  };
}

export function selectActiveGame(games) {
  if (!games?.length) return null;
  const live = games.find((game) => game.status?.state === 'in');
  if (live) return live;

  const finals = games.filter((game) => game.status?.state === 'post');
  if (!finals.length) return null;

  return finals.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}
