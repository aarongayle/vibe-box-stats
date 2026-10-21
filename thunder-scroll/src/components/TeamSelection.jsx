import { Link } from 'react-router-dom';
import { getAllTeams } from '../utils/teams';

const TeamSelection = () => {
  const teams = getAllTeams();

  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">ThunderScroll</p>
          <h1 className="font-sans text-4xl font-semibold text-zinc-100">Select Your Team</h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Hyper-fast, text-forward updates sourced from ESPN&apos;s hidden endpoints. Nothing but data for NBA fans.
          </p>
        </header>

        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">NBA Teams</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {teams.map((team) => (
              <Link
                key={team.slug}
                to={`/${team.slug}`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-4 py-6 transition-colors hover:bg-zinc-900/50 hover:border-zinc-700"
              >
                {team.logo && (
                  <img
                    src={team.logo}
                    alt={team.shortName}
                    className="h-16 w-16 object-contain"
                    loading="lazy"
                  />
                )}
                <span className="font-sans text-lg font-semibold text-zinc-100">{team.shortName}</span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{team.abbreviation}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeamSelection;
