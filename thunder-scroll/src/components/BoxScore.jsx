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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{teamLabel}</p>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">BOX</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-zinc-900/70 text-left text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              <th className="py-3 pr-4 font-sans font-semibold">Player</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">MIN</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">PTS</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">3PM-A</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">OREB</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">DREB</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">AST</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">STL</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">BLK</th>
              <th className="px-2 py-3 text-right font-mono font-semibold">PF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {teamPlayers.map((player) => (
              <tr key={player.id} className="align-middle">
                <td className="max-w-[160px] truncate py-2.5 pr-4 font-sans text-sm text-zinc-100">{player.name}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.minutes}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.points}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.threePointersMade}-{player.threePointersAttempted}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.offensiveRebounds}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.defensiveRebounds}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.assists}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.steals}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.blocks}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono text-[13px] text-zinc-100">
                  {player.fouls}
                </td>
              </tr>
            ))}
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
    </section>
  );
};

export default BoxScore;
