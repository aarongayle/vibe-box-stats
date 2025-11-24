import { Link } from 'react-router-dom';

import { NBA_TEAMS } from '../data/teams';

const TeamSelect = () => {
  const teams = [...NBA_TEAMS].sort((a, b) => a.city.localeCompare(b.city));

  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">ThunderScroll</p>
          <h1 className="font-sans text-4xl font-semibold text-zinc-100">Pick your NBA team.</h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Hyper-fast, text-forward updates sourced from ESPN&apos;s hidden endpoints. Nothing but data for every fan
            base.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/${team.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-900/60 bg-zinc-900/30 px-5 py-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{team.city}</p>
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">NBA</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-zinc-100">{team.name}</p>
                <span className="font-mono text-lg" style={{ color: team.accent }}>
                  {team.abbreviation}
                </span>
              </div>
              <p className="text-sm text-zinc-500">{team.fullName}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TeamSelect;
