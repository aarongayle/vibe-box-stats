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
  const plusMinusIdx = keyIndex.plusMinus;
  const threesIdx = keyIndex['threePointFieldGoalsMade-threePointFieldGoalsAttempted'];
  const fgIdx = keyIndex['fieldGoalsMade-fieldGoalsAttempted'];
  const ftIdx = keyIndex['freeThrowsMade-freeThrowsAttempted'];

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
        const fgStat = fgIdx !== undefined ? parseMadeAttempted(stats[fgIdx]) : { made: 0, attempted: 0 };
        const ftStat = ftIdx !== undefined ? parseMadeAttempted(stats[ftIdx]) : { made: 0, attempted: 0 };

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
          plusMinus: plusMinusIdx !== undefined ? Number(stats[plusMinusIdx]) || 0 : 0,
          fouls: foulsIdx !== undefined ? Number(stats[foulsIdx]) || 0 : 0,
          threePointersMade: threesStat.made,
          threePointersAttempted: threesStat.attempted,
          fieldGoalsMade: fgStat.made,
          fieldGoalsAttempted: fgStat.attempted,
          freeThrowsMade: ftStat.made,
          freeThrowsAttempted: ftStat.attempted,
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

const parseClockToSeconds = (display) => {
  if (!display || typeof display !== 'string') return null;
  const match = display.trim().match(/^(\d{1,2}):(\d{1,2})(?:\.(\d+))?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + seconds;
};

const parsePlays = (plays, teamId, abbreviations = {}) => {
  if (!Array.isArray(plays)) return [];

  return plays
    .map((play) => {
      const periodNumber = play?.period?.number ?? 0;
      const periodDisplay =
        play?.period?.displayValue ||
        (periodNumber > 4 ? `OT${periodNumber - 4}` : periodNumber ? `Q${periodNumber}` : '');
      const playTeamId = play?.team?.id ?? null;

      let teamSide = null;
      if (playTeamId) {
        teamSide = playTeamId === teamId ? 'team' : 'opponent';
      }

      const teamAbbreviation = playTeamId ? abbreviations[playTeamId] ?? null : null;

      const participants = Array.isArray(play?.participants)
        ? play.participants
            .map((participant) => {
              const athlete = participant?.athlete ?? participant;
              return athlete?.displayName || athlete?.shortName || null;
            })
            .filter(Boolean)
        : [];

      const clockDisplay = play?.clock?.displayValue ?? '';

      return {
        id: play?.id ?? play?.sequenceNumber ?? `${periodNumber}-${clockDisplay}-${play?.text ?? ''}`,
        sequenceNumber: Number(play?.sequenceNumber) || 0,
        text: play?.text ?? '',
        type: play?.type?.text ?? '',
        period: periodNumber,
        periodDisplay,
        clock: clockDisplay,
        clockSeconds: parseClockToSeconds(clockDisplay),
        scoringPlay: Boolean(play?.scoringPlay),
        shootingPlay: Boolean(play?.shootingPlay),
        scoreValue: Number(play?.scoreValue) || 0,
        homeScore: toNumber(play?.homeScore),
        awayScore: toNumber(play?.awayScore),
        teamId: playTeamId,
        teamSide,
        teamAbbreviation,
        participants,
        wallclock: play?.wallclock ?? null,
      };
    })
    .sort((a, b) => {
      if (a.period !== b.period) return b.period - a.period;
      return b.sequenceNumber - a.sequenceNumber;
    });
};

// NBA timeout rules: 7 per regulation game, at most 4 in the 4th quarter and
// 2 after the 3:00 mark of the 4th; each overtime gets a fresh 2 (no carryover).
const REGULATION_TIMEOUTS = 7;
const FOURTH_QUARTER_TIMEOUT_CAP = 4;
const LAST_THREE_MINUTES_TIMEOUT_CAP = 2;
const OVERTIME_TIMEOUTS = 2;
const LAST_THREE_MINUTES = 180;

// ESPN shows "4:32" above a minute and "40.2" below it.
const statClockSeconds = (display) => {
  const parsed = parseClockToSeconds(display);
  if (parsed !== null) return parsed;
  const seconds = Number.parseFloat(display);
  return Number.isFinite(seconds) ? seconds : null;
};

const isTeamFoul = (typeText) => {
  if (!typeText.includes('foul')) return false;
  // Offensive fouls and technicals don't count toward the team-foul penalty.
  return !typeText.includes('offensive') && !typeText.includes('technical');
};

const countTimeoutsRemaining = (timeouts, period, clock) => {
  const charged = timeouts.filter((timeout) => !timeout.refunded);

  if (period > 4) {
    const usedThisOvertime = charged.filter((timeout) => timeout.period === period).length;
    return Math.max(0, OVERTIME_TIMEOUTS - usedThisOvertime);
  }

  let remaining = REGULATION_TIMEOUTS - charged.length;
  if (period === 4) {
    const fourth = charged.filter((timeout) => timeout.period === 4);
    remaining = Math.min(remaining, FOURTH_QUARTER_TIMEOUT_CAP - fourth.length);
    if (clock !== null && clock < LAST_THREE_MINUTES) {
      const lateUsed = fourth.filter((timeout) => timeout.clock !== null && timeout.clock < LAST_THREE_MINUTES).length;
      remaining = Math.min(remaining, LAST_THREE_MINUTES_TIMEOUT_CAP - lateUsed);
    }
  }
  return Math.max(0, remaining);
};

const emptyTeamStats = () => ({ fouls: 0, challengesUsed: 0, challengesWon: 0, timeouts: [] });

const calculateGameStats = (plays) => {
  const teamStats = {};

  const getStats = (id) => {
    if (!teamStats[id]) {
      teamStats[id] = emptyTeamStats();
    }
    return teamStats[id];
  };

  if (!Array.isArray(plays) || plays.length === 0) {
    return { teamStats, currentPeriod: 0, currentClock: null };
  }

  // The game clock is where the latest period has run down to. (ESPN sometimes
  // appends corrected plays out of order, so the last row isn't reliable.)
  const currentPeriod = Math.max(0, ...plays.map((play) => play.period?.number ?? 0));
  const currentClocks = plays
    .filter((play) => play.period?.number === currentPeriod)
    .map((play) => statClockSeconds(play.clock?.displayValue))
    .filter((clock) => clock !== null);
  const currentClock = currentClocks.length ? Math.min(...currentClocks) : null;

  // A challenge is logged as a "Full Timeout" (or a "Challenge") followed by a
  // "Coach's Challenge (<result>)" row at the same game clock. Track who called
  // it so result rows without a team ("replaycenter") can still be attributed.
  const momentOf = (play) => `${play.period?.number}|${play.clock?.displayValue}`;
  const callerAtMoment = {};
  const challengeResults = [];

  plays.forEach((play) => {
    const typeText = play.type?.text?.toLowerCase() || '';
    const period = play.period?.number;

    if (typeText.startsWith("coach's challenge")) {
      challengeResults.push(play);
      return;
    }

    const teamId = play.team?.id;
    if (!teamId) return;
    const stats = getStats(teamId);

    if (typeText === 'challenge') {
      callerAtMoment[momentOf(play)] = teamId;
      return;
    }

    if (typeText.includes('timeout')) {
      callerAtMoment[momentOf(play)] = teamId;
      stats.timeouts.push({
        period,
        clock: statClockSeconds(play.clock?.displayValue),
        moment: momentOf(play),
        refunded: false,
      });
      return;
    }

    if (period === currentPeriod && isTeamFoul(typeText)) {
      stats.fouls++;
    }
  });

  challengeResults.forEach((play) => {
    const typeText = play.type?.text?.toLowerCase() || '';
    const moment = momentOf(play);
    const teamId = play.team?.id ?? callerAtMoment[moment];
    if (!teamId) return;

    const stats = getStats(teamId);
    stats.challengesUsed++;
    const challengeTimeout = stats.timeouts.find((timeout) => timeout.moment === moment && !timeout.refunded);
    if (typeText.includes('overturned')) {
      // Successful challenge: team keeps its timeout and earns a second challenge.
      stats.challengesWon++;
      if (challengeTimeout) challengeTimeout.refunded = true;
    } else if (!challengeTimeout) {
      // Unsuccessful challenge costs a timeout; usually already logged as a Full Timeout.
      stats.timeouts.push({
        period: play.period?.number,
        clock: statClockSeconds(play.clock?.displayValue),
        moment,
        refunded: false,
      });
    }
  });

  return { teamStats, currentPeriod, currentClock };
};

const summarizeTeamStats = (stats, currentPeriod, currentClock) => {
  // Every team gets one challenge; overturning the first earns a second (max two).
  const challengesAllowed = stats.challengesWon > 0 ? 2 : 1;
  return {
    fouls: stats.fouls,
    challengeUsed: stats.challengesUsed >= challengesAllowed,
    timeoutsRemaining: countTimeoutsRemaining(stats.timeouts, currentPeriod, currentClock),
  };
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

  const { teamStats: computedStats, currentPeriod, currentClock } = calculateGameStats(data?.plays);
  const teamIdValue = team?.id || team?.team?.id;
  const opponentId = opponent?.id || opponent?.team?.id;

  const teamStats = summarizeTeamStats(
    (teamIdValue && computedStats[teamIdValue]) || emptyTeamStats(),
    currentPeriod,
    currentClock,
  );
  const opponentStats = summarizeTeamStats(
    (opponentId && computedStats[opponentId]) || emptyTeamStats(),
    currentPeriod,
    currentClock,
  );

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
      stats: teamStats,
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
    injuries: parseInjuries(data?.injuries, teamId),
    plays: parsePlays(data?.plays, teamId, {
      [teamIdValue]: teamTeam?.abbreviation ?? teamTeam?.shortDisplayName ?? null,
      [opponentId]: opponentTeam?.abbreviation ?? opponentTeam?.shortDisplayName ?? null,
    }),
    competition: {
      date: data?.header?.competitions?.[0]?.date ?? null,
      home: (() => {
        const homeCompetitor = competitors.find((c) => c.homeAway === 'home');
        const t = homeCompetitor?.team ?? homeCompetitor;
        return t
          ? {
              id: homeCompetitor?.id || t?.id,
              abbreviation: t?.abbreviation ?? t?.shortDisplayName ?? null,
              name: t?.displayName ?? t?.name ?? null,
            }
          : null;
      })(),
      away: (() => {
        const awayCompetitor = competitors.find((c) => c.homeAway === 'away');
        const t = awayCompetitor?.team ?? awayCompetitor;
        return t
          ? {
              id: awayCompetitor?.id || t?.id,
              abbreviation: t?.abbreviation ?? t?.shortDisplayName ?? null,
              name: t?.displayName ?? t?.name ?? null,
            }
          : null;
      })(),
    },
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
