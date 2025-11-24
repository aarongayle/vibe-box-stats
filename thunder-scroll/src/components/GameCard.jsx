const formatDateLabel = (iso, options) =>
  new Intl.DateTimeFormat('en-US', options).format(new Date(iso));

const GameCard = ({ game, isActive, onClick, teamColor }) => {
  if (!game) return null;

  const isLive = game.status?.state === 'in';
  const isFinal = game.status?.state === 'post';
  const isFuture = !isLive && !isFinal;

  const dayLabel = formatDateLabel(game.date, { month: 'short', day: 'numeric' });
  const weekdayLabel = formatDateLabel(game.date, { weekday: 'short' });
  const timeLabel = formatDateLabel(game.date, { hour: 'numeric', minute: '2-digit' });

  const matchup = `${game.isHome ? 'vs' : '@'} ${game.opponent?.shortName ?? 'TBD'}`;
  const resultLabel = isFinal ? `${game.result ?? ''} · Final` : '';
  const liveDetail = game.status?.detail || game.status?.displayClock || 'Live';
  const futureDetail = `${weekdayLabel} · ${timeLabel}`;

  const handleClick = () => {
    if (isFinal && onClick) {
      onClick(game);
    }
  };

  return (
    <div
      className={`flex min-w-[220px] flex-col gap-3 rounded-2xl border border-zinc-800 px-4 py-3 transition-colors ${
        isActive ? 'bg-zinc-900/40' : 'bg-transparent'
      } ${isFinal ? 'cursor-pointer hover:bg-zinc-900/20' : ''}`}
      data-game-id={game.id}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-zinc-500">
        <span>{isLive ? 'Today' : `${weekdayLabel} ${dayLabel}`}</span>
        {isFinal && <span className="text-zinc-600">{game.status?.shortDetail || 'Final'}</span>}
      </div>

      <div className="flex items-center gap-3">
        {game.opponent?.logo ? (
          <img
            src={game.opponent.logo}
            alt={game.opponent.shortName}
            className="h-10 w-10 rounded-full border border-zinc-800 object-contain bg-zinc-950"
            loading="lazy"
          />
        ) : (
          <div className="h-10 w-10 rounded-full border border-zinc-800" />
        )}
        <div className="flex flex-col">
          <span className="font-sans text-lg text-zinc-100">{matchup}</span>
          {game.opponent?.record && (
            <span className="font-mono text-xs text-zinc-500">{game.opponent.record}</span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between font-mono text-sm">
        <span className="text-zinc-500">{isLive ? liveDetail : isFinal ? resultLabel : futureDetail}</span>
        <span 
          className="text-lg font-semibold" 
          style={{ color: isLive ? (teamColor || '#007AC1') : '#f4f4f5' }}
        >
          {isFuture ? timeLabel : game.scoreline ?? '--'}
        </span>
      </div>
    </div>
  );
};

export default GameCard;
