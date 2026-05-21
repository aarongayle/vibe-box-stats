import { useMemo, useState } from 'react';

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

const PlayRow = ({ play, teamAbbreviation, opponentAbbreviation }) => {
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
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
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
      {scoreLabel && (
        <div className="flex-shrink-0 text-right font-mono text-xs text-zinc-400">
          {scoreLabel}
        </div>
      )}
    </li>
  );
};

const PlayByPlay = ({ plays, loading, team, opponent }) => {
  const [filter, setFilter] = useState('all');

  const teamAbbreviation = team?.abbreviation ?? 'TEA';
  const opponentAbbreviation = opponent?.abbreviation ?? 'OPP';

  const filteredPlays = useMemo(() => {
    if (!plays || plays.length === 0) return [];
    return plays.filter((play) => matchesFilter(play, filter));
  }, [plays, filter]);

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
        {filteredPlays.map((play) => (
          <PlayRow
            key={play.id}
            play={play}
            teamAbbreviation={teamAbbreviation}
            opponentAbbreviation={opponentAbbreviation}
          />
        ))}
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

      {renderBody()}
    </div>
  );
};

export default PlayByPlay;
