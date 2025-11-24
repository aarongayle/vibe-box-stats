import { Link } from 'react-router-dom';
import { getAllTeams } from '../utils/teams';

function HomePage() {
  const teams = getAllTeams();

  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">ThunderScroll</p>
          <h1 className="font-sans text-4xl font-semibold text-zinc-100">Select your team.</h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Choose an NBA team to view their schedule and live box scores.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.slug}
              to={`/${team.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-lg font-medium text-zinc-200 group-hover:text-white">
                  {team.name}
                </span>
                <div
                  className="h-3 w-3 rounded-full opacity-50 shadow-[0_0_8px] transition-opacity group-hover:opacity-100"
                  style={{ 
                    backgroundColor: team.color,
                    boxShadow: `0 0 12px ${team.color}`
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
