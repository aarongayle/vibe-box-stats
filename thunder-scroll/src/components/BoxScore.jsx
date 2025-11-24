import { useState } from 'react';

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

const BoxScore = ({ summary, loading, fallbackGame }) => {
  const [reboundsExpanded, setReboundsExpanded] = useState(false);
  const [stocksExpanded, setStocksExpanded] = useState(false);

  const status = summary?.status ?? fallbackGame?.status ?? {};
  const isLive = status?.state === 'in';

  const opponent = summary?.opponent ?? fallbackGame?.opponent ?? null;
  const thunderScore = summary?.thunder?.score ?? fallbackGame?.thunderScore ?? null;
  const opponentScore = opponent ? opponent.score ?? fallbackGame?.opponentScore ?? null : fallbackGame?.opponentScore ?? null;

  const matchupLabel = fallbackGame
    ? `${fallbackGame.isHome ? 'vs' : '@'} ${fallbackGame.opponent?.shortName ?? opponent?.shortName ?? ''}`
    : opponent?.shortName
    ? `vs ${opponent.shortName}`
    : 'Thunder';

  const clockLabel = isLive
    ? `${status.displayClock || 'LIVE'} • Q${status.period ?? '—'}`
    : status.detail || fallbackGame?.status?.shortDetail || 'Final';

  const players = summary?.players ?? { thunder: [], opponent: [] };
  const thunderPlayers = players.thunder ?? [];
  const opponentPlayers = players.opponent ?? [];
  const hasAnyPlayers = thunderPlayers.length > 0 || opponentPlayers.length > 0;

  const renderTeamSection = (teamLabel, teamPlayers) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{teamLabel}</p>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">BOX</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              <th className="py-2 pr-6 font-sans">Player</th>
              <th className="py-2 px-3 text-right font-mono">MIN</th>
              <th className="py-2 px-3 text-right font-mono">PTS</th>
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
        </table>
      </div>
    </div>
  );

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
      <div className="space-y-10">
        {thunderPlayers.length > 0 && renderTeamSection('Thunder', thunderPlayers)}
        {opponentPlayers.length > 0 && renderTeamSection(opponentLabel, opponentPlayers)}
      </div>
    );
  };

  const renderInjuries = () => {
    const injuries = summary?.injuries;
    if (loading || !injuries) return null;

    const hasThunderInjuries = injuries.thunder?.length > 0;
    const hasOpponentInjuries = injuries.opponent?.length > 0;

    if (!hasThunderInjuries && !hasOpponentInjuries) return null;

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
        {renderInjuryTable('Thunder', injuries.thunder)}
        {renderInjuryTable(opponentLabel, injuries.opponent)}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Live Box Score</p>
          <p className="font-sans text-2xl font-semibold text-zinc-100">Thunder {matchupLabel}</p>
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
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">OKC</p>
            <p className={`font-mono text-3xl font-semibold ${isLive ? 'text-thunder' : 'text-zinc-100'}`}>
              {thunderScore ?? '--'}
            </p>
          </div>
          <div className="text-center font-mono text-xs uppercase tracking-[0.3em] text-zinc-600">vs</div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {opponent?.abbreviation ?? fallbackGame?.opponent?.abbreviation ?? 'OPP'}
            </p>
            <p className={`font-mono text-3xl font-semibold ${isLive ? 'text-thunder' : 'text-zinc-100'}`}>
              {opponentScore ?? '--'}
            </p>
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
