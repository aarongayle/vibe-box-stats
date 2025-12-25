import { useState, useRef, useCallback, forwardRef } from 'react';

const formatUpdatedAt = (iso) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
};

const LiveIndicator = () => (
  <div className="flex items-center gap-2">
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
    </span>
    <span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-thunder">Live</span>
  </div>
);

// Calculate team totals from players
const calculateTotals = (players) => {
  if (!players || players.length === 0) return null;
  
  return players.reduce((totals, player) => {
    return {
      minutes: totals.minutes + (parseInt(player.minutes) || 0),
      points: totals.points + (player.points || 0),
      offensiveRebounds: totals.offensiveRebounds + (player.offensiveRebounds || 0),
      defensiveRebounds: totals.defensiveRebounds + (player.defensiveRebounds || 0),
      assists: totals.assists + (player.assists || 0),
      threePointersMade: totals.threePointersMade + (player.threePointersMade || 0),
      threePointersAttempted: totals.threePointersAttempted + (player.threePointersAttempted || 0),
      steals: totals.steals + (player.steals || 0),
      blocks: totals.blocks + (player.blocks || 0),
      fouls: totals.fouls + (player.fouls || 0),
      fieldGoalsMade: totals.fieldGoalsMade + (player.fieldGoalsMade || 0),
      fieldGoalsAttempted: totals.fieldGoalsAttempted + (player.fieldGoalsAttempted || 0),
      freeThrowsMade: totals.freeThrowsMade + (player.freeThrowsMade || 0),
      freeThrowsAttempted: totals.freeThrowsAttempted + (player.freeThrowsAttempted || 0),
    };
  }, {
    minutes: 0,
    points: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    assists: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    steals: 0,
    blocks: 0,
    fouls: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
  });
};

// Calculate percentage
const calcPercent = (made, attempted) => {
  if (!attempted || attempted === 0) return '0%';
  return `${Math.round((made / attempted) * 100)}%`;
};

// Team section component with forwarded ref for scroll syncing
const TeamSection = forwardRef(function TeamSection({ 
  teamLabel, 
  teamPlayers, 
  onScroll,
  reboundsExpanded,
  setReboundsExpanded,
  stocksExpanded,
  setStocksExpanded,
  showAllStats
}, ref) {
  const totals = calculateTotals(teamPlayers);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{teamLabel}</p>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">BOX</span>
      </div>
      <div 
        className="overflow-x-auto"
        ref={ref}
        onScroll={onScroll}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              <th className="py-2 pr-6 font-sans">Player</th>
              <th className="py-2 px-3 text-right font-mono">MIN</th>
              <th className="py-2 px-3 text-right font-mono">PTS</th>
              {showAllStats && (
                <>
                  <th className="py-2 px-3 text-right font-mono">FG</th>
                  <th className="py-2 px-3 text-right font-mono">FT</th>
                </>
              )}
              {reboundsExpanded ? (
                <>
                  <th
                    className="py-2 px-3 text-right font-mono cursor-pointer underline hover:text-zinc-400 transition-colors"
                    onClick={() => setReboundsExpanded(false)}
                    title="Click to collapse"
                  >
                    OREB
                  </th>
                  <th
                    className="py-2 px-3 text-right font-mono cursor-pointer underline hover:text-zinc-400 transition-colors"
                    onClick={() => setReboundsExpanded(false)}
                    title="Click to collapse"
                  >
                    DREB
                  </th>
                </>
              ) : (
                <th
                  className="py-2 px-3 text-right font-mono cursor-pointer underline hover:text-zinc-400 transition-colors"
                  onClick={() => setReboundsExpanded(true)}
                  title="Click to expand"
                >
                  REB
                </th>
              )}
              <th className="py-2 px-3 text-right font-mono">AST</th>
              <th className="py-2 px-3 text-right font-mono">3P</th>
              {stocksExpanded ? (
                <>
                  <th
                    className="py-2 px-3 text-right font-mono cursor-pointer underline hover:text-zinc-400 transition-colors"
                    onClick={() => setStocksExpanded(false)}
                    title="Click to collapse"
                  >
                    STL
                  </th>
                  <th
                    className="py-2 px-3 text-right font-mono cursor-pointer underline hover:text-zinc-400 transition-colors"
                    onClick={() => setStocksExpanded(false)}
                    title="Click to collapse"
                  >
                    BLK
                  </th>
                </>
              ) : (
                <th
                  className="py-2 px-3 text-right font-mono cursor-pointer underline hover:text-zinc-400 transition-colors"
                  onClick={() => setStocksExpanded(true)}
                  title="Click to expand"
                >
                  STK
                </th>
              )}
              <th className="py-2 px-3 text-right font-mono">PF</th>
            </tr>
          </thead>
          <tbody>
            {teamPlayers.map((player) => {
              const isStarter = player.isStarter;
              const textColor = isStarter ? 'text-zinc-100' : 'text-zinc-500';
              const nameColor = isStarter ? 'text-zinc-100 font-medium' : 'text-zinc-400';
              const isEjected = player.ejected ?? false;

              return (
                <tr key={player.id} className="border-t border-zinc-900/70">
                  <td className={`py-2.5 pr-6 font-sans ${nameColor}`}>
                    <div className="flex items-center gap-2">
                      <span className={isEjected ? 'line-through' : ''}>{player.name}</span>
                      {player.isOnCourt && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-emerald-400">
                          C
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.minutes}</td>
                  <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.points}</td>
                  {showAllStats && (
                    <>
                      <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>
                        {player.fieldGoalsMade}-{player.fieldGoalsAttempted}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>
                        {player.freeThrowsMade}-{player.freeThrowsAttempted}
                      </td>
                    </>
                  )}
                  {reboundsExpanded ? (
                    <>
                      <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.offensiveRebounds}</td>
                      <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.defensiveRebounds}</td>
                    </>
                  ) : (
                    <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>
                      {(player.offensiveRebounds ?? 0) + (player.defensiveRebounds ?? 0)}
                    </td>
                  )}
                  <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.assists}</td>
                  <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>
                    {player.threePointersMade}-{player.threePointersAttempted}
                  </td>
                  {stocksExpanded ? (
                    <>
                      <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.steals ?? 0}</td>
                      <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.blocks ?? 0}</td>
                    </>
                  ) : (
                    <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>
                      {(player.steals ?? 0) + (player.blocks ?? 0)}
                    </td>
                  )}
                  <td className={`py-2.5 px-3 text-right font-mono ${textColor}`}>{player.fouls}</td>
                </tr>
              );
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t-2 border-zinc-700 bg-zinc-900/50">
                <td className="py-2.5 pr-6 font-sans font-semibold text-zinc-100">TOTALS</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.minutes}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.points}</td>
                {showAllStats && (
                  <>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">
                      {totals.fieldGoalsMade}-{totals.fieldGoalsAttempted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">
                      {totals.freeThrowsMade}-{totals.freeThrowsAttempted}
                    </td>
                  </>
                )}
                {reboundsExpanded ? (
                  <>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.offensiveRebounds}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.defensiveRebounds}</td>
                  </>
                ) : (
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">
                    {totals.offensiveRebounds + totals.defensiveRebounds}
                  </td>
                )}
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.assists}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">
                  {totals.threePointersMade}-{totals.threePointersAttempted}
                </td>
                {stocksExpanded ? (
                  <>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.steals}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.blocks}</td>
                  </>
                ) : (
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">
                    {totals.steals + totals.blocks}
                  </td>
                )}
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100">{totals.fouls}</td>
              </tr>
              {/* Percentages row */}
              <tr className="bg-zinc-900/30">
                <td className="py-1.5 pr-6 font-sans text-[10px] uppercase tracking-wider text-zinc-500"></td>
                <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                {showAllStats && (
                  <>
                    <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-400">
                      {calcPercent(totals.fieldGoalsMade, totals.fieldGoalsAttempted)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-400">
                      {calcPercent(totals.freeThrowsMade, totals.freeThrowsAttempted)}
                    </td>
                  </>
                )}
                {reboundsExpanded ? (
                  <>
                    <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                    <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                  </>
                ) : (
                  <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                )}
                <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-400">
                  {calcPercent(totals.threePointersMade, totals.threePointersAttempted)}
                </td>
                {stocksExpanded ? (
                  <>
                    <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                    <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                  </>
                ) : (
                  <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
                )}
                <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
});

const BoxScore = ({ summary, loading, fallbackGame, team }) => {
  const [reboundsExpanded, setReboundsExpanded] = useState(false);
  const [stocksExpanded, setStocksExpanded] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);
  
  // Refs for synced scrolling
  const teamScrollRef = useRef(null);
  const opponentScrollRef = useRef(null);
  const isScrollingSynced = useRef(false);

  const handleTeamScroll = useCallback(() => {
    if (isScrollingSynced.current) return;
    isScrollingSynced.current = true;
    
    if (teamScrollRef.current && opponentScrollRef.current) {
      opponentScrollRef.current.scrollLeft = teamScrollRef.current.scrollLeft;
    }
    
    requestAnimationFrame(() => {
      isScrollingSynced.current = false;
    });
  }, []);

  const handleOpponentScroll = useCallback(() => {
    if (isScrollingSynced.current) return;
    isScrollingSynced.current = true;
    
    if (teamScrollRef.current && opponentScrollRef.current) {
      teamScrollRef.current.scrollLeft = opponentScrollRef.current.scrollLeft;
    }
    
    requestAnimationFrame(() => {
      isScrollingSynced.current = false;
    });
  }, []);

  const status = summary?.status ?? fallbackGame?.status ?? {};
  const isLive = status?.state === 'in';

  const opponent = summary?.opponent ?? fallbackGame?.opponent ?? null;
  const teamScore = summary?.team?.score ?? fallbackGame?.teamScore ?? null;
  const opponentScore = opponent ? opponent.score ?? fallbackGame?.opponentScore ?? null : fallbackGame?.opponentScore ?? null;

  const teamName = team?.shortName ?? 'Team';
  const teamAbbreviation = team?.abbreviation ?? 'TEA';

  const matchupLabel = fallbackGame
    ? `${fallbackGame.isHome ? 'vs' : '@'} ${fallbackGame.opponent?.shortName ?? opponent?.shortName ?? ''}`
    : opponent?.shortName
    ? `vs ${opponent.shortName}`
    : teamName;

  const clockLabel = isLive
    ? `${status.displayClock || 'LIVE'} • Q${status.period ?? '—'}`
    : status.detail || fallbackGame?.status?.shortDetail || 'Final';

  const players = summary?.players ?? { team: [], opponent: [] };
  const teamPlayers = players.team ?? [];
  const opponentPlayers = players.opponent ?? [];
  const hasAnyPlayers = teamPlayers.length > 0 || opponentPlayers.length > 0;

  const teamStats = summary?.team?.stats;
  const opponentStats = summary?.opponent?.stats;

  const renderTeamStats = (stats, alignRight = false) => {
    if (!stats) return null;
    const rowClass = `flex items-center gap-2 ${alignRight ? 'justify-end' : 'justify-start'}`;

    // Estimate timeouts
    let timeoutsDisplay = '-';
    if (stats.timeoutsRemaining !== null && stats.timeoutsRemaining !== undefined) {
      timeoutsDisplay = stats.timeoutsRemaining;
    } else if (stats.timeoutsUsed !== undefined) {
      // Rough estimate (7 per game standard)
      timeoutsDisplay = Math.max(0, 7 - stats.timeoutsUsed);
    }
    
    // If game is final, timeouts usually meaningless (0), but if computed from used, shows remaining.
    // For completed games, maybe hide or show 0?
    if (status.state === 'post') {
       timeoutsDisplay = 0;
    }

    const isBonus = stats.fouls >= 5;

    return (
      <div className={`mt-3 flex flex-col gap-1 text-[10px] font-mono ${alignRight ? 'items-end' : 'items-start'}`}>
        <div className={rowClass}>
          <span className="uppercase tracking-wider text-zinc-600">Fouls</span>
          <span className={isBonus ? 'font-bold text-orange-400' : 'text-zinc-300'}>{stats.fouls}</span>
        </div>
        <div className={rowClass}>
          <span className="uppercase tracking-wider text-zinc-600">Timeouts</span>
          <span className="text-zinc-300">{timeoutsDisplay}</span>
        </div>
        <div className={rowClass}>
          <span className="uppercase tracking-wider text-zinc-600">Challenge</span>
          <span className={stats.challengeUsed ? 'text-zinc-500 decoration-zinc-600' : 'text-emerald-400'}>
            {stats.challengeUsed ? 'Used' : 'Rem'}
          </span>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="py-10 text-center font-mono text-sm text-zinc-500">
          Updating…
        </div>
      );
    }

    if (!hasAnyPlayers) {
      return (
        <div className="py-10 text-center font-mono text-sm text-zinc-500">
          Box score will populate once the game goes live.
        </div>
      );
    }

    const opponentLabel =
      summary?.opponent?.shortName ??
      fallbackGame?.opponent?.shortName ??
      summary?.opponent?.abbreviation ??
      'Opponent';

    return (
      <div className="space-y-6">
        {/* All Stats Toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAllStats(!showAllStats)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
              showAllStats 
                ? 'bg-thunder text-zinc-900 font-semibold' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
            }`}
          >
            All Stats
          </button>
        </div>
        <div className="space-y-10">
          {teamPlayers.length > 0 && (
            <TeamSection
              ref={teamScrollRef}
              teamLabel={teamName}
              teamPlayers={teamPlayers}
              onScroll={handleTeamScroll}
              reboundsExpanded={reboundsExpanded}
              setReboundsExpanded={setReboundsExpanded}
              stocksExpanded={stocksExpanded}
              setStocksExpanded={setStocksExpanded}
              showAllStats={showAllStats}
            />
          )}
          {opponentPlayers.length > 0 && (
            <TeamSection
              ref={opponentScrollRef}
              teamLabel={opponentLabel}
              teamPlayers={opponentPlayers}
              onScroll={handleOpponentScroll}
              reboundsExpanded={reboundsExpanded}
              setReboundsExpanded={setReboundsExpanded}
              stocksExpanded={stocksExpanded}
              setStocksExpanded={setStocksExpanded}
              showAllStats={showAllStats}
            />
          )}
        </div>
      </div>
    );
  };

  const renderInjuries = () => {
    const injuries = summary?.injuries;
    if (loading || !injuries) return null;

    const hasTeamInjuries = injuries.team?.length > 0;
    const hasOpponentInjuries = injuries.opponent?.length > 0;

    if (!hasTeamInjuries && !hasOpponentInjuries) return null;

    const renderInjuryTable = (teamLabel, teamInjuries) => {
      if (!teamInjuries || teamInjuries.length === 0) return null;

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{teamLabel} Injuries</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  <th className="py-2 pr-6 font-sans">Player</th>
                  <th className="py-2 px-3 font-mono">Side</th>
                  <th className="py-2 px-3 font-mono">Type</th>
                  <th className="py-2 px-3 font-mono">Detail</th>
                  <th className="py-2 px-3 text-right font-mono">Return</th>
                </tr>
              </thead>
              <tbody>
                {teamInjuries.map((injury) => (
                  <tr key={injury.id} className="border-t border-zinc-900/70">
                    <td className="py-2.5 pr-6 font-sans text-zinc-400">
                      <span className="font-medium text-zinc-300">{injury.name}</span>
                      {injury.status && <span className="ml-2 text-[10px] uppercase tracking-wider text-zinc-600">({injury.status})</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-500">{injury.details.side || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-500">{injury.details.type || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-500">{injury.details.detail || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-500">
                      {injury.details.formattedReturnDate || injury.details.returnDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const opponentLabel =
      summary?.opponent?.shortName ??
      fallbackGame?.opponent?.shortName ??
      summary?.opponent?.abbreviation ??
      'Opponent';

    return (
      <div className="space-y-8 pt-6 mt-6 border-t border-zinc-800">
        {renderInjuryTable(teamName, injuries.team)}
        {renderInjuryTable(opponentLabel, injuries.opponent)}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Live Box Score</p>
          <p className="font-sans text-2xl font-semibold text-zinc-100">{teamName} {matchupLabel}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isLive && <LiveIndicator />}
          {summary?.fetchedAt && (
            <span className="font-mono text-xs text-zinc-500">Updated {formatUpdatedAt(summary.fetchedAt)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{teamAbbreviation}</p>
            <p className={`font-mono text-3xl font-semibold ${isLive ? 'text-thunder' : 'text-zinc-100'}`}>
              {teamScore ?? '--'}
            </p>
            {renderTeamStats(teamStats)}
          </div>
          <div className="text-center font-mono text-xs uppercase tracking-[0.3em] text-zinc-600">vs</div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {opponent?.abbreviation ?? fallbackGame?.opponent?.abbreviation ?? 'OPP'}
            </p>
            <p className={`font-mono text-3xl font-semibold ${isLive ? 'text-thunder' : 'text-zinc-100'}`}>
              {opponentScore ?? '--'}
            </p>
            {renderTeamStats(opponentStats, true)}
          </div>
        </div>
        <div className="text-right font-mono text-xs text-zinc-500">{clockLabel}</div>
      </div>

      <div className="rounded-2xl border border-zinc-800 px-4 py-2">{renderTable()}</div>
      {renderInjuries()}
    </section>
  );
};

export default BoxScore;
