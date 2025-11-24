export const TEAM_ID = '25';
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

const resolveApiBase = () => {
  const envValue = import.meta.env.VITE_API_BASE;
  const rawValue = typeof envValue === 'string' ? envValue.trim() : '/api';
  return rawValue.replace(/\/$/, '');
};

const API_BASE = resolveApiBase();
const USE_PROXY = API_BASE.length > 0;

const defaultFetchOptions = {
  headers: {
    'Cache-Control': 'no-cache',
  },
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

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const httpGet = async (path) => {
  if (!USE_PROXY && !isAbsoluteUrl(path)) {
    throw new Error('Relative URL requested without an API proxy configured');
  }

  const url = isAbsoluteUrl(path)
    ? path
    : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

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

const parseTeamPlayers = (teamSection) => {
  if (!teamSection) return [];

  const statTable = teamSection.statistics?.find((stat) => Array.isArray(stat.athletes));
  if (!statTable) return [];

  const keyIndex =
    statTable.keys?.reduce((acc, key, index) => {
      acc[key] = index;
      return acc;
    }, {}) ?? {};

  const minutesIdx = keyIndex.minutes;
  const pointsIdx = keyIndex.points;
  const reboundsIdx = keyIndex.rebounds;
  const assistsIdx = keyIndex.assists;
  const offensiveRebIdx = keyIndex.offensiveRebounds;
  const defensiveRebIdx = keyIndex.defensiveRebounds;
  const foulsIdx = keyIndex.fouls ?? keyIndex.foulsPersonal;
  const stealsIdx = keyIndex.steals;
  const blocksIdx = keyIndex.blocks;
  const threesIdx = keyIndex['threePointFieldGoalsMade-threePointFieldGoalsAttempted'];

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
        
        const isStarter = row.starter ?? false;
        const isOnCourt = row.onCourt ?? false;
        const isEjected = athlete.ejected ?? row.ejected ?? false;

        const parseMadeAttempted = (value = '') => {
          if (typeof value !== 'string') return { made: 0, attempted: 0 };
          const [madeRaw, attemptedRaw] = value.split('-');
          const made = Number(madeRaw);
          const attempted = Number(attemptedRaw);
          return {
            made: Number.isFinite(made) ? made : 0,
            attempted: Number.isFinite(attempted) ? attempted : 0,
          };
        };

        const threesStat = threesIdx !== undefined ? parseMadeAttempted(stats[threesIdx]) : { made: 0, attempted: 0 };

        return {
          id: athlete.id ?? lastName,
          name: lastName,
          displayName: athlete.displayName,
          isStarter,
          isOnCourt,
          ejected: isEjected,
          minutes: minutesDisplay,
          minutesValue,
          points: pointsIdx !== undefined ? Number(stats[pointsIdx]) || 0 : 0,
          rebounds: reboundsIdx !== undefined ? Number(stats[reboundsIdx]) || 0 : 0,
          offensiveRebounds: offensiveRebIdx !== undefined ? Number(stats[offensiveRebIdx]) || 0 : 0,
          defensiveRebounds: defensiveRebIdx !== undefined ? Number(stats[defensiveRebIdx]) || 0 : 0,
          assists: assistsIdx !== undefined ? Number(stats[assistsIdx]) || 0 : 0,
          steals: stealsIdx !== undefined ? Number(stats[stealsIdx]) || 0 : 0,
          blocks: blocksIdx !== undefined ? Number(stats[blocksIdx]) || 0 : 0,
          fouls: foulsIdx !== undefined ? Number(stats[foulsIdx]) || 0 : 0,
          threePointersMade: threesStat.made,
          threePointersAttempted: threesStat.attempted,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.minutesValue !== a.minutesValue) return b.minutesValue - a.minutesValue;
        return b.points - a.points;
      }) ?? []
  );
};

const parsePlayers = (boxscorePlayers = []) => {
  const thunderSection = boxscorePlayers.find((team) => team.team?.id === TEAM_ID);
  const opponentSection = boxscorePlayers.find((team) => team.team?.id !== TEAM_ID);

  return {
    thunder: parseTeamPlayers(thunderSection),
    opponent: parseTeamPlayers(opponentSection),
  };
};


const calculateOnCourtPlayers = (allPlayers, plays) => {
  if (!plays || !plays.length) return;

  // Map name to player ID
  const playerMap = new Map();
  const activePlayers = new Set();

  allPlayers.forEach((p) => {
    if (p.displayName) playerMap.set(p.displayName, p.id);
    if (p.isStarter) activePlayers.add(p.id);
  });

  plays.forEach((play) => {
    if (play.type?.text === 'Substitution' || play.type?.id === '584') {
      const text = play.text;
      // Regex to capture names: "Player A enters the game for Player B"
      const match = text.match(/^(.*?) enters the game for (.*?)$/);
      if (match) {
        const enteringName = match[1];
        const leavingName = match[2];

        const enteringId = playerMap.get(enteringName);
        const leavingId = playerMap.get(leavingName);

        if (enteringId) activePlayers.add(enteringId);
        if (leavingId) activePlayers.delete(leavingId);
      }
    }
  });

  // Update players
  allPlayers.forEach((p) => {
    p.isOnCourt = activePlayers.has(p.id);
  });
};

const parseInjuries = (injuriesData) => {
  if (!Array.isArray(injuriesData)) return { thunder: [], opponent: [] };

  const thunderSection = injuriesData.find((item) => item.team?.id === TEAM_ID);
  const opponentSection = injuriesData.find((item) => item.team?.id !== TEAM_ID);

  const mapInjury = (injury) => {
    const athlete = injury.athlete || {};
    const details = injury.details || {};
    
    let returnDate = details.returnDate;
    if (returnDate) {
      try {
         const date = new Date(returnDate);
         if (!isNaN(date.getTime())) {
             returnDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
             });
         }
      } catch (e) {
        // keep original
      }
    }

    return {
      id: athlete.id || athlete.displayName,
      name: athlete.displayName || athlete.name || 'Unknown',
      status: injury.status,
      details: {
        side: details.side,
        type: details.type,
        detail: details.detail,
        returnDate: details.returnDate,
        formattedReturnDate: returnDate
      },
    };
  };

  return {
    thunder: thunderSection?.injuries?.map(mapInjury) || [],
    opponent: opponentSection?.injuries?.map(mapInjury) || [],
  };
};

export async function fetchSchedule() {
  const path = USE_PROXY ? '/schedule' : `${ESPN_BASE_URL}/teams/${TEAM_ID}/schedule`;
  const data = await httpGet(path);
  return (data?.events ?? []).map(normalizeScheduleEvent);
}

export async function fetchGameSummary(gameId) {
  const basePath = USE_PROXY
    ? `/summary?gameId=${encodeURIComponent(gameId)}`
    : `${ESPN_BASE_URL}/summary?event=${gameId}`;
  const data = await httpGet(basePath);
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

  const parsedPlayers = parsePlayers(data?.boxscore?.players);
  const allPlayers = [...parsedPlayers.thunder, ...parsedPlayers.opponent];
  calculateOnCourtPlayers(allPlayers, data?.plays);

  // Extract team stats: timeouts, fouls per quarter, challenge status
  const parseTeamStats = (competitor, plays) => {
    if (!competitor) return null;

    // Timeouts remaining - check multiple possible locations
    const timeoutsRemaining = competitor.timeouts ?? 
                              competitor.statistics?.find(s => s.name === 'timeoutsRemaining')?.displayValue ??
                              competitor.statistics?.find(s => s.name === 'timeouts')?.displayValue ??
                              null;

    // Fouls per quarter from linescores
    const linescores = competitor.linescores ?? [];
    const foulsPerQuarter = linescores.map((period, index) => ({
      period: period.value ?? period.number ?? (index + 1),
      fouls: period.fouls ?? period.statistics?.find(s => s.name === 'fouls')?.displayValue ?? 0,
    }));

    // Challenge status - check multiple locations and play-by-play
    let hasChallenge = null;
    
    // First check direct competitor fields
    if (competitor.challengeAvailable !== undefined) {
      hasChallenge = competitor.challengeAvailable;
    } else if (competitor.challengesRemaining !== undefined) {
      hasChallenge = competitor.challengesRemaining > 0;
    } else if (competitor.challengesUsed !== undefined) {
      hasChallenge = competitor.challengesUsed < 1; // Assuming 1 challenge per game
    }
    
    // If not found, check play-by-play for challenge usage
    if (hasChallenge === null && plays && Array.isArray(plays)) {
      const teamId = competitor.id ?? competitor.team?.id;
      const challengePlays = plays.filter(play => 
        play.type?.text?.toLowerCase().includes('challenge') ||
        play.type?.id === 'challenge' ||
        play.text?.toLowerCase().includes('challenge')
      );
      
      // If we found challenge plays, check if any were successful/used
      if (challengePlays.length > 0) {
        // Assume challenge is used if we see challenge plays
        // More sophisticated: check if challenge was successful (team keeps it) or unsuccessful (team loses it)
        const unsuccessfulChallenges = challengePlays.filter(play => 
          play.text?.toLowerCase().includes('unsuccessful') ||
          play.text?.toLowerCase().includes('denied')
        );
        // If there's an unsuccessful challenge, challenge is likely used
        hasChallenge = unsuccessfulChallenges.length === 0;
      }
    }

    return {
      timeoutsRemaining: timeoutsRemaining !== null ? Number(timeoutsRemaining) : null,
      foulsPerQuarter,
      hasChallenge,
    };
  };

  const thunderStats = parseTeamStats(thunder, data?.plays);
  const opponentStats = parseTeamStats(opponent, data?.plays);

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
      stats: thunderStats,
    },
    opponent: opponent
      ? {
          name: opponentTeam?.displayName ?? opponentTeam?.name ?? 'Opponent',
          shortName: opponentTeam?.shortDisplayName ?? opponentTeam?.abbreviation ?? opponentTeam?.name ?? 'OPP',
          abbreviation: opponentTeam?.abbreviation ?? opponentTeam?.shortDisplayName ?? 'OPP',
          logo: pickLogo(opponentTeam),
          score: toNumber(opponent?.score?.value ?? opponent?.score?.displayValue ?? opponent?.score),
          record: getRecordSummary(opponent),
          stats: opponentStats,
        }
      : null,
    players: parsedPlayers,
    injuries: parseInjuries(data?.injuries),
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
