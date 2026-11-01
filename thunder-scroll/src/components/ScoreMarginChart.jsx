import { useMemo, useRef, useState } from 'react';

const REGULATION_PERIOD = 720;
const OVERTIME_PERIOD = 300;
const WIDTH = 600;
const HEIGHT = 96;
// Blue/orange diverging pair: readable on the near-black surface and CVD-safe.
const TEAM_COLOR = '#3B9EDE';
const OPPONENT_COLOR = '#E0803A';

const periodLength = (period) => (period > 4 ? OVERTIME_PERIOD : REGULATION_PERIOD);
const periodStart = (period) =>
  period <= 1 ? 0 : Math.min(period - 1, 4) * REGULATION_PERIOD + Math.max(period - 5, 0) * OVERTIME_PERIOD;
const periodName = (period) => (period > 4 ? `OT${period > 5 ? period - 4 : ''}` : `Q${period}`);

const buildSeries = (plays, teamIsHome) => {
  const points = [{ t: 0, margin: 0, team: 0, opponent: 0, period: 1, clock: '12:00' }];
  const chronological = [...plays]
    .filter((play) => play.homeScore !== null && play.awayScore !== null && play.period > 0 && play.clockSeconds !== null)
    .sort((a, b) => a.period - b.period || a.sequenceNumber - b.sequenceNumber);

  for (const play of chronological) {
    const team = teamIsHome ? play.homeScore : play.awayScore;
    const opponent = teamIsHome ? play.awayScore : play.homeScore;
    const last = points[points.length - 1];
    if (team === last.team && opponent === last.opponent) continue;
    const t = periodStart(play.period) + periodLength(play.period) - play.clockSeconds;
    points.push({ t: Math.max(t, last.t), margin: team - opponent, team, opponent, period: play.period, clock: play.clock });
  }
  return points;
};

const ScoreMarginChart = ({ plays, teamIsHome, teamAbbreviation, opponentAbbreviation, isLive }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const plotRef = useRef(null);

  const chart = useMemo(() => {
    if (!plays?.length || teamIsHome === null) return null;
    const points = buildSeries(plays, teamIsHome);
    if (points.length < 2) return null;

    const lastPeriod = Math.max(4, ...plays.map((play) => play.period || 0));
    const totalTime = periodStart(lastPeriod) + periodLength(lastPeriod);
    const latest = points[points.length - 1];
    // Live games end the line at the latest score change; finals run to the buzzer.
    const endTime = isLive ? latest.t : totalTime;

    const teamLead = Math.max(0, ...points.map((p) => p.margin));
    const opponentLead = Math.max(0, ...points.map((p) => -p.margin));
    const extent = Math.max(5, Math.ceil(Math.max(teamLead, opponentLead) / 5) * 5);

    const x = (t) => (t / totalTime) * WIDTH;
    const y = (margin) => HEIGHT / 2 - (margin / extent) * (HEIGHT / 2);

    let line = `M${x(0)},${y(0)}`;
    for (let i = 1; i < points.length; i += 1) {
      line += ` H${x(points[i].t)} V${y(points[i].margin)}`;
    }
    line += ` H${x(endTime)}`;
    const area = `${line} V${y(0)} Z`;

    const periodTicks = Array.from({ length: lastPeriod }, (_, i) => ({
      period: i + 1,
      start: x(periodStart(i + 1)),
      mid: x(periodStart(i + 1) + periodLength(i + 1) / 2),
    }));

    return { points, totalTime, extent, teamLead, opponentLead, line, area, periodTicks, x, y };
  }, [plays, teamIsHome, isLive]);

  if (!chart) return null;

  const { points, totalTime, extent, teamLead, opponentLead, line, area, periodTicks, x, y } = chart;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  const handlePointer = (event) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = ((event.clientX - rect.left) / rect.width) * totalTime;
    let index = 0;
    for (let i = 0; i < points.length && points[i].t <= t; i += 1) index = i;
    setHoverIndex(index);
  };

  const marginLabel = (margin) => {
    if (margin === 0) return 'Tied';
    return margin > 0 ? `${teamAbbreviation} +${margin}` : `${opponentAbbreviation} +${-margin}`;
  };

  const hoverLeft = hovered ? (x(hovered.t) / WIDTH) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Score margin</p>
        <p className="font-mono text-[11px] text-zinc-500">
          Largest lead{' '}
          <span className="text-zinc-300">
            {teamAbbreviation} +{teamLead}
          </span>
          {' · '}
          <span className="text-zinc-300">
            {opponentAbbreviation} +{opponentLead}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative h-24 w-8 flex-shrink-0 text-right font-mono text-[10px] leading-none text-zinc-600">
          <span className="absolute right-0 top-0">+{extent}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">0</span>
          <span className="absolute bottom-0 right-0">−{extent}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            ref={plotRef}
            className="relative h-24 cursor-crosshair touch-none"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label={`Score margin over time. Largest leads: ${teamAbbreviation} ${teamLead}, ${opponentAbbreviation} ${opponentLead}.`}
            >
              <defs>
                <clipPath id="margin-above">
                  <rect x="0" y="-2" width={WIDTH} height={HEIGHT / 2 + 2} />
                </clipPath>
                <clipPath id="margin-below">
                  <rect x="0" y={HEIGHT / 2} width={WIDTH} height={HEIGHT / 2 + 2} />
                </clipPath>
              </defs>

              {periodTicks.slice(1).map((tick) => (
                <line
                  key={tick.period}
                  x1={tick.start}
                  x2={tick.start}
                  y1="0"
                  y2={HEIGHT}
                  stroke="#27272a"
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <line x1="0" x2={WIDTH} y1={y(0)} y2={y(0)} stroke="#3f3f46" vectorEffect="non-scaling-stroke" />

              <path d={area} fill={TEAM_COLOR} fillOpacity="0.18" clipPath="url(#margin-above)" />
              <path d={area} fill={OPPONENT_COLOR} fillOpacity="0.18" clipPath="url(#margin-below)" />
              <path
                d={line}
                fill="none"
                stroke={TEAM_COLOR}
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                clipPath="url(#margin-above)"
              />
              <path
                d={line}
                fill="none"
                stroke={OPPONENT_COLOR}
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                clipPath="url(#margin-below)"
              />

              {hovered && (
                <line
                  x1={x(hovered.t)}
                  x2={x(hovered.t)}
                  y1="0"
                  y2={HEIGHT}
                  stroke="#a1a1aa"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {hovered && (
              <>
                <span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink"
                  style={{
                    left: `${hoverLeft}%`,
                    top: `${(y(hovered.margin) / HEIGHT) * 100}%`,
                    backgroundColor: hovered.margin < 0 ? OPPONENT_COLOR : TEAM_COLOR,
                  }}
                />
                <div
                  className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-300 shadow-lg"
                  style={
                    hoverLeft > 60
                      ? { right: `${100 - hoverLeft}%` }
                      : { left: `${hoverLeft}%` }
                  }
                >
                  <span className="text-zinc-500">
                    {periodName(hovered.period)} {hovered.clock}
                  </span>{' '}
                  <span className="text-zinc-100">{marginLabel(hovered.margin)}</span>{' '}
                  <span className="text-zinc-500">
                    ({hovered.team}-{hovered.opponent})
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="relative mt-1 h-3 font-mono text-[10px] text-zinc-600">
            {periodTicks.map((tick) => (
              <span
                key={tick.period}
                className="absolute -translate-x-1/2"
                style={{ left: `${(tick.mid / WIDTH) * 100}%` }}
              >
                {periodName(tick.period)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreMarginChart;
