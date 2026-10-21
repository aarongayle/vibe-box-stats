import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';

import { findNbaActionForPlay } from '../utils/nbaVideos';

const formatScore = (play) => {
  if (play.homeScore === null || play.awayScore === null) return null;
  return `${play.awayScore}-${play.homeScore}`;
};

const periodLabel = (play) => {
  if (play.periodDisplay) return play.periodDisplay;
  if (!play.period) return '';
  return play.period > 4 ? `OT${play.period - 4}` : `Q${play.period}`;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'fouls', label: 'Fouls' },
  { id: 'turnovers', label: 'Turnovers' },
];

const matchesFilter = (play, filterId) => {
  if (filterId === 'all') return true;
  const type = (play.type || '').toLowerCase();
  const text = (play.text || '').toLowerCase();

  if (filterId === 'scoring') return play.scoringPlay;
  if (filterId === 'fouls') return type.includes('foul') || text.includes('foul');
  if (filterId === 'turnovers') {
    return (
      type.includes('turnover') ||
      type.includes('steal') ||
      type.includes('travel') ||
      text.includes('turnover')
    );
  }
  return true;
};

const PlayRow = ({
  play,
  teamAbbreviation,
  opponentAbbreviation,
  nbaAction,
  replayUrl,
}) => {
  const isTeam = play.teamSide === 'team';
  const isOpponent = play.teamSide === 'opponent';

  const accent = isTeam
    ? 'border-l-thunder'
    : isOpponent
    ? 'border-l-zinc-600'
    : 'border-l-transparent';

  const teamLabel = isTeam
    ? teamAbbreviation
    : isOpponent
    ? opponentAbbreviation
    : '—';

  const scoreLabel = formatScore(play);

  return (
    <li
      className={`flex items-start gap-3 border-l-2 ${accent} bg-zinc-950/40 px-3 py-2.5 rounded-r-lg`}
    >
      <div className="flex w-14 flex-shrink-0 flex-col text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        <span>{periodLabel(play)}</span>
        <span className="text-zinc-400">{play.clock || '--:--'}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          <span className={isTeam ? 'text-thunder' : 'text-zinc-400'}>{teamLabel}</span>
          {play.type && <span className="text-zinc-600">·</span>}
          {play.type && <span className="text-zinc-500">{play.type}</span>}
          {play.scoringPlay && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
              Score
            </span>
          )}
        </div>
        <p className={`mt-1 text-sm leading-snug ${play.scoringPlay ? 'text-zinc-100' : 'text-zinc-300'}`}>
          {play.text || '—'}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        {scoreLabel && (
          <div className="text-right font-mono text-xs text-zinc-400">{scoreLabel}</div>
        )}
        {nbaAction && replayUrl && (
          <a
            href={replayUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1 rounded-full border border-thunder/50 bg-thunder/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-thunder transition-colors hover:bg-thunder/20"
            title="Watch NBA replay on NBA.com"
          >
            <Play className="h-3 w-3" />
            Replay
          </a>
        )}
      </div>
    </li>
  );
};

const buildNbaEventUrl = (nbaGameId, nbaAction) => {
  if (!nbaGameId || !nbaAction?.actionNumber) return null;
  const seasonStart = (() => {
    if (!nbaGameId || nbaGameId.length < 5) return null;
    const yearTwoDigit = nbaGameId.slice(3, 5);
    const year = Number(yearTwoDigit);
    if (!Number.isFinite(year)) return null;
    const fullYear = 2000 + year;
    return `${fullYear}-${String(fullYear + 1).slice(-2)}`;
  })();
  const params = new URLSearchParams({
    GameEventID: String(nbaAction.actionNumber),
    GameID: nbaGameId,
    flag: '1',
  });
  if (seasonStart) params.set('Season', seasonStart);
  return `https://www.nba.com/stats/events?${params.toString()}`;
};

const PlayByPlay = ({
  plays,
  loading,
  team,
  opponent,
  nbaGameId,
  nbaActionIndex,
  nbaVideoSupported,
}) => {
  const [filter, setFilter] = useState('all');

  const teamAbbreviation = team?.abbreviation ?? 'TEA';
  const opponentAbbreviation = opponent?.abbreviation ?? 'OPP';

  const filteredPlays = useMemo(() => {
    if (!plays || plays.length === 0) return [];
    return plays.filter((play) => matchesFilter(play, filter));
  }, [plays, filter]);

  const matchedCount = useMemo(() => {
    if (!nbaActionIndex || !plays) return 0;
    let count = 0;
    for (const play of plays) {
      if (findNbaActionForPlay(play, nbaActionIndex)) count += 1;
    }
    return count;
  }, [plays, nbaActionIndex]);

  const renderBody = () => {
    if (loading && (!plays || plays.length === 0)) {
      return (
        <div className="py-10 text-center font-mono text-sm text-zinc-500">
          Loading plays…
        </div>
      );
    }

    if (!plays || plays.length === 0) {
      return (
        <div className="py-10 text-center font-mono text-sm text-zinc-500">
          Play-by-play will populate once the game tips off.
        </div>
      );
    }

    if (filteredPlays.length === 0) {
      return (
        <div className="py-10 text-center font-mono text-sm text-zinc-500">
          No plays match this filter yet.
        </div>
      );
    }

    return (
      <ol className="space-y-1.5">
        {filteredPlays.map((play) => {
          const nbaAction = nbaActionIndex ? findNbaActionForPlay(play, nbaActionIndex) : null;
          const replayUrl = nbaAction ? buildNbaEventUrl(nbaGameId, nbaAction) : null;
          return (
            <PlayRow
              key={play.id}
              play={play}
              teamAbbreviation={teamAbbreviation}
              opponentAbbreviation={opponentAbbreviation}
              nbaAction={nbaAction}
              replayUrl={replayUrl}
            />
          );
        })}
      </ol>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
          const isActive = option.id === filter;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors ${
                isActive
                  ? 'bg-thunder text-zinc-950 font-semibold'
                  : 'border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
        {plays && plays.length > 0 && (
          <span className="ml-auto font-mono text-[11px] text-zinc-500">
            {filteredPlays.length} of {plays.length} plays
          </span>
        )}
      </div>

      {nbaVideoSupported === false && (
        <p className="font-mono text-[11px] text-zinc-500">
          NBA replays aren&apos;t available for this game.
        </p>
      )}
      {nbaVideoSupported !== false && nbaGameId && plays && plays.length > 0 && matchedCount > 0 && (
        <p className="font-mono text-[11px] text-zinc-500">
          NBA replays available on {matchedCount} of {plays.length} plays — tap{' '}
          <span className="text-thunder">Replay</span> to open the clip on NBA.com.
        </p>
      )}

      {renderBody()}
    </div>
  );
};

export default PlayByPlay;
