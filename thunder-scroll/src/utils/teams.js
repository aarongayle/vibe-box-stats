// NBA Team mapping: slug -> { id, name, abbreviation, shortName }
// ESPN team IDs for NBA teams
export const TEAMS = {
  hawks: { id: '1', name: 'Atlanta Hawks', abbreviation: 'ATL', shortName: 'Hawks' },
  celtics: { id: '2', name: 'Boston Celtics', abbreviation: 'BOS', shortName: 'Celtics' },
  nets: { id: '17', name: 'Brooklyn Nets', abbreviation: 'BKN', shortName: 'Nets' },
  hornets: { id: '30', name: 'Charlotte Hornets', abbreviation: 'CHA', shortName: 'Hornets' },
  bulls: { id: '4', name: 'Chicago Bulls', abbreviation: 'CHI', shortName: 'Bulls' },
  cavaliers: { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', shortName: 'Cavaliers' },
  mavs: { id: '6', name: 'Dallas Mavericks', abbreviation: 'DAL', shortName: 'Mavericks' },
  nuggets: { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', shortName: 'Nuggets' },
  pistons: { id: '8', name: 'Detroit Pistons', abbreviation: 'DET', shortName: 'Pistons' },
  warriors: { id: '9', name: 'Golden State Warriors', abbreviation: 'GSW', shortName: 'Warriors' },
  rockets: { id: '10', name: 'Houston Rockets', abbreviation: 'HOU', shortName: 'Rockets' },
  pacers: { id: '11', name: 'Indiana Pacers', abbreviation: 'IND', shortName: 'Pacers' },
  clippers: { id: '12', name: 'LA Clippers', abbreviation: 'LAC', shortName: 'Clippers' },
  lakers: { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', shortName: 'Lakers' },
  grizzlies: { id: '29', name: 'Memphis Grizzlies', abbreviation: 'MEM', shortName: 'Grizzlies' },
  heat: { id: '14', name: 'Miami Heat', abbreviation: 'MIA', shortName: 'Heat' },
  bucks: { id: '15', name: 'Milwaukee Bucks', abbreviation: 'MIL', shortName: 'Bucks' },
  timberwolves: { id: '16', name: 'Minnesota Timberwolves', abbreviation: 'MIN', shortName: 'Timberwolves' },
  pelicans: { id: '3', name: 'New Orleans Pelicans', abbreviation: 'NOP', shortName: 'Pelicans' },
  knicks: { id: '18', name: 'New York Knicks', abbreviation: 'NYK', shortName: 'Knicks' },
  thunder: { id: '25', name: 'Oklahoma City Thunder', abbreviation: 'OKC', shortName: 'Thunder' },
  magic: { id: '19', name: 'Orlando Magic', abbreviation: 'ORL', shortName: 'Magic' },
  '76ers': { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', shortName: '76ers' },
  suns: { id: '21', name: 'Phoenix Suns', abbreviation: 'PHX', shortName: 'Suns' },
  blazers: { id: '22', name: 'Portland Trail Blazers', abbreviation: 'POR', shortName: 'Trail Blazers' },
  kings: { id: '23', name: 'Sacramento Kings', abbreviation: 'SAC', shortName: 'Kings' },
  spurs: { id: '24', name: 'San Antonio Spurs', abbreviation: 'SAS', shortName: 'Spurs' },
  raptors: { id: '28', name: 'Toronto Raptors', abbreviation: 'TOR', shortName: 'Raptors' },
  jazz: { id: '26', name: 'Utah Jazz', abbreviation: 'UTA', shortName: 'Jazz' },
  wizards: { id: '27', name: 'Washington Wizards', abbreviation: 'WAS', shortName: 'Wizards' },
};

export function getTeamBySlug(slug) {
  return TEAMS[slug] || null;
}

export function getAllTeams() {
  return Object.entries(TEAMS).map(([slug, team]) => ({
    slug,
    ...team,
  }));
}

export function getTeamSlugById(id) {
  const entry = Object.entries(TEAMS).find(([, team]) => team.id === id);
  return entry ? entry[0] : null;
}
