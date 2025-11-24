const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

const resolveApiBase = () => {
  const envValue = import.meta.env.VITE_API_BASE;
  const rawValue = typeof envValue === 'string' ? envValue.trim() : '/api';
  return rawValue.replace(/\/$/, '');
};

const API_BASE = resolveApiBase();
const USE_PROXY = API_BASE.length > 0;

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

const normalizeScheduleEvent = (event, teamId) => {
  const competition = event?.competitions?.[0];
  const status = competition?.status?.type ?? competition?.status ?? event?.status?.type ?? {};
  const competitors = competition?.competitors ?? [];
  const team = competitors.find((t) => t.id === teamId || t.team?.id === teamId);
  const opponent = competitors.find((t) => t.id !== teamId && t.team?.id !== teamId);

  const teamTeam = team?.team ?? team;
  const opponentTeam = opponent?.team ?? opponent;

  const teamScore = toNumber(team?.score?.value ?? team?.score?.displayValue ?? team?.score);
  const opponentScore = toNumber(opponent?.score?.value ?? opponent?.score?.displayValue ?? opponent?.score);

  const result =
    status.state === 'post' && teamScore !== null && opponentScore !== null
      ? teamScore > opponentScore
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
    isHome: team?.homeAway === 'home',
    teamScore,
    opponentScore,
    result,
    scoreline: teamScore !== null && opponentScore !== null ? `${teamScore} - ${opponentScore}` : null,
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

const parsePlayers = (boxscorePlayers = [], teamId) => {
  const teamSection = boxscorePlayers.find((team) => team.team?.id === teamId);
  const opponentSection = boxscorePlayers.find((team) => team.team?.id !== teamId);

  return {
    team: parseTeamPlayers(teamSection),
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

const parseInjuries = (injuriesData, teamId) => {
  if (!Array.isArray(injuriesData)) return { team: [], opponent: [] };

  const teamSection = injuriesData.find((item) => item.team?.id === teamId);
  const opponentSection = injuriesData.find((item) => item.team?.id !== teamId);

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
    team: teamSection?.injuries?.map(mapInjury) || [],
    opponent: opponentSection?.injuries?.map(mapInjury) || [],
  };
};

const calculateGameStats = (plays, currentPeriod) => {
  const teamStats = {};

  const getStats = (id) => {
    if (!teamStats[id]) {
      teamStats[id] = { fouls: 0, challengeUsed: false, timeoutsUsed: 0 };
    }
    return teamStats[id];
  };

  if (!plays || !Array.isArray(plays)) return teamStats;

  plays.forEach((play) => {
    const teamId = play.team?.id;
    if (!teamId) return;

    const stats = getStats(teamId);

    // Challenge usage (approximate based on play text)
    if (play.text && play.text.toLowerCase().includes("coach's challenge")) {
      stats.challengeUsed = true;
    }

    // Timeouts used
    if (play.type?.text?.toLowerCase().includes('timeout')) {
      stats.timeoutsUsed++;
    }

    // Fouls in current period
    if (play.period?.number === currentPeriod) {
      const typeText = play.type?.text?.toLowerCase() || '';
      if (typeText.includes('foul')) {
        // Exclude offensive, technical, etc. for bonus calculation purposes
        if (
          !typeText.includes('offensive') &&
          !typeText.includes('technical') &&
          !typeText.includes('defensive 3-seconds') &&
          !typeText.includes('flagrant') // Flagrant usually counts, but let's double check. Yes, flagrant counts as team foul.
        ) {
           // Keep flagrant, it counts towards penalty.
           // What about 'clear path'? Counts.
           stats.fouls++;
        } else if (typeText.includes('flagrant') || typeText.includes('clear path')) {
            stats.fouls++;
        }
      }
    }
  });

  return teamStats;
};

export async function fetchSchedule(teamId) {
  const path = USE_PROXY 
    ? `/schedule?teamId=${encodeURIComponent(teamId)}` 
    : `${ESPN_BASE_URL}/teams/${teamId}/schedule`;
  const data = await httpGet(path);
  const events = (data?.events ?? []).map((event) => normalizeScheduleEvent(event, teamId));
  
  // Extract team record from top-level team data (overall season record)
  const teamData = data?.team || data?.teams?.[0];
  const teamRecord = teamData?.recordSummary || null;
  
  return {
    events,
    teamRecord,
  };
}

export async function fetchGameSummary(gameId, teamId) {
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
  const team = competitors.find((t) => t.id === teamId || t.team?.id === teamId);
  const opponent = competitors.find((t) => t.id !== teamId && t.team?.id !== teamId);
  const teamTeam = team?.team ?? team;
  const opponentTeam = opponent?.team ?? opponent;

  const parsedPlayers = parsePlayers(data?.boxscore?.players, teamId);
  const allPlayers = [...parsedPlayers.team, ...parsedPlayers.opponent];
  calculateOnCourtPlayers(allPlayers, data?.plays);

  const computedStats = calculateGameStats(data?.plays, status.period);
  const teamIdValue = team?.id || team?.team?.id;
  const opponentId = opponent?.id || opponent?.team?.id;
  
  const teamStats = (teamIdValue && computedStats[teamIdValue]) || { fouls: 0, challengeUsed: false, timeoutsUsed: 0 };
  const opponentStats = (opponentId && computedStats[opponentId]) || { fouls: 0, challengeUsed: false, timeoutsUsed: 0 };

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
    team: {
      score: toNumber(team?.score?.value ?? team?.score?.displayValue ?? team?.score),
      record: getRecordSummary(team),
      stats: {
        fouls: teamStats.fouls,
        challengeUsed: teamStats.challengeUsed,
        timeoutsUsed: teamStats.timeoutsUsed,
        timeoutsRemaining: team?.timeoutsRemaining ?? null, // Try to get from API if available
      }
    },
    opponent: opponent
      ? {
          name: opponentTeam?.displayName ?? opponentTeam?.name ?? 'Opponent',
          shortName: opponentTeam?.shortDisplayName ?? opponentTeam?.abbreviation ?? opponentTeam?.name ?? 'OPP',
          abbreviation: opponentTeam?.abbreviation ?? opponentTeam?.shortDisplayName ?? 'OPP',
          logo: pickLogo(opponentTeam),
          score: toNumber(opponent?.score?.value ?? opponent?.score?.displayValue ?? opponent?.score),
          record: getRecordSummary(opponent),
          stats: {
            fouls: opponentStats.fouls,
            challengeUsed: opponentStats.challengeUsed,
            timeoutsUsed: opponentStats.timeoutsUsed,
            timeoutsRemaining: opponent?.timeoutsRemaining ?? null,
          }
        }
      : null,
    players: parsedPlayers,
    injuries: parseInjuries(data?.injuries, teamId),
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
