import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import GameCard from './GameCard';
import BoxScore from './BoxScore';
import { fetchGameSummary, fetchSchedule, selectActiveGame } from '../utils/api';
import { getTeamBySlug } from '../utils/teams';

const POLL_INTERVAL = 30_000;

const ScheduleSkeleton = () =>
  [1, 2, 3].map((item) => (
    <div
      key={item}
      className="min-w-[220px] rounded-2xl border border-zinc-900/60 bg-zinc-900/30 px-4 py-3"
    >
      <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-800" />
      <div className="mt-4 h-4 w-32 animate-pulse rounded-full bg-zinc-800" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded-full bg-zinc-900" />
    </div>
  ));

function TeamPage() {
  const { teamSlug } = useParams();
  const team = getTeamBySlug(teamSlug);
  
  const [schedule, setSchedule] = useState([]);
  const [teamRecord, setTeamRecord] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [offline, setOffline] = useState(false);
  const scheduleListRef = useRef(null);

  const loadSchedule = useCallback(async () => {
    if (!team?.id) return;
    try {
      setLoadingSchedule(true);
      const result = await fetchSchedule(team.id);
      setSchedule(result.events);
      setTeamRecord(result.teamRecord);
      setActiveGame(selectActiveGame(result.events));
      setOffline(false);
    } catch (error) {
      console.error(error);
      setOffline(true);
    } finally {
      setLoadingSchedule(false);
    }
  }, [team?.id]);

  const loadSummary = useCallback(
    async (gameId, { silent = false } = {}) => {
      if (!gameId || !team?.id) return;
      try {
        if (!silent) setLoadingSummary(true);
        const data = await fetchGameSummary(gameId, team.id);
        if (data) {
          setSummary(data);
          setOffline(false);
        }
      } catch (error) {
        console.error(error);
        setOffline(true);
      } finally {
        if (!silent) setLoadingSummary(false);
      }
    },
    [team?.id]
  );

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (!activeGame?.id) {
      setSummary(null);
      return;
    }
    const state = activeGame.status?.state;
    if (state !== 'in' && state !== 'post') {
      setSummary(null);
      setLoadingSummary(false);
      return;
    }
    loadSummary(activeGame.id);
  }, [activeGame?.id, activeGame?.status?.state, loadSummary]);

  useEffect(() => {
    if (!activeGame?.id || summary?.status?.state !== 'in') return undefined;
    const id = setInterval(() => {
      loadSummary(activeGame.id, { silent: true });
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [activeGame?.id, summary?.status?.state, loadSummary]);

  useEffect(() => {
    if (!activeGame?.id || !scheduleListRef.current) return;
    const activeCard = scheduleListRef.current.querySelector(`[data-game-id="${activeGame.id}"]`);
    if (!activeCard) return;
    activeCard.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeGame?.id, schedule]);

  const scheduleContent = useMemo(() => {
    if (loadingSchedule && !schedule.length) {
      return <ScheduleSkeleton />;
    }

    if (!schedule.length) {
      return (
        <div className="text-sm font-mono text-zinc-500">
          No games found. Check back when the league posts the slate.
        </div>
      );
    }

    const handleGameClick = (game) => {
      setActiveGame(game);
    };

    return schedule.map((game) => (
      <GameCard key={game.id} game={game} isActive={game.id === activeGame?.id} onClick={handleGameClick} />
    ));
  }, [loadingSchedule, schedule, activeGame]);

  if (!team) {
    return (
      <div className="min-h-screen bg-ink text-zinc-100">
        <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
          <div className="rounded-2xl border border-zinc-800 px-4 py-12 text-center">
            <p className="font-mono text-sm text-zinc-500">Team not found</p>
            <Link to="/" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-100">
              ← Back to team selection
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">ThunderScroll</p>
            <Link
              to="/"
              className="text-xs uppercase tracking-[0.3em] text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              Select Team
            </Link>
          </div>
          <h1 className="font-sans text-4xl font-semibold" style={{ color: team.primaryColor }}>
            {team.shortName} Box Score, distilled.
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Hyper-fast, text-forward updates sourced from ESPN&apos;s hidden endpoints. Nothing but data for{' '}
            <span style={{ color: team.primaryColor }}>{team.shortName}</span> fans.
          </p>
          {offline && <span className="font-mono text-xs uppercase text-rose-400">Offline</span>}
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Schedule</p>
              {teamRecord && (
                <span className="font-mono text-xs text-zinc-400">{teamRecord}</span>
              )}
            </div>
            <button
              type="button"
              onClick={loadSchedule}
              disabled={loadingSchedule}
              className="flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs font-mono uppercase tracking-[0.3em] text-zinc-400 transition-colors hover:text-zinc-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingSchedule ? 'animate-spin text-zinc-600' : ''}`} />
              Sync
            </button>
          </div>
          <div ref={scheduleListRef} className="flex gap-3 overflow-x-auto pb-1">
            {scheduleContent}
          </div>
        </section>

        {activeGame ? (
          <BoxScore summary={summary} loading={loadingSummary && !summary} fallbackGame={activeGame} team={team} />
        ) : (
          <div className="rounded-2xl border border-zinc-800 px-4 py-12 text-center font-mono text-sm text-zinc-500">
            No live or recent results. Tap Sync once the {team.shortName} hit the floor.
          </div>
        )}
      </main>
    </div>
  );
}

export default TeamPage;
