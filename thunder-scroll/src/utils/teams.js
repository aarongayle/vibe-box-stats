// NBA Team mapping: slug -> { id, name, abbreviation, shortName, logo }
// ESPN team IDs for NBA teams
// Logo URLs use ESPN's standard team logo format
const getLogoUrl = (abbreviation) => 
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation}.png`;

export const TEAMS = {
  hawks: { id: '1', name: 'Atlanta Hawks', abbreviation: 'ATL', shortName: 'Hawks', logo: getLogoUrl('ATL') },
  celtics: { id: '2', name: 'Boston Celtics', abbreviation: 'BOS', shortName: 'Celtics', logo: getLogoUrl('BOS') },
  nets: { id: '17', name: 'Brooklyn Nets', abbreviation: 'BKN', shortName: 'Nets', logo: getLogoUrl('BKN') },
  hornets: { id: '30', name: 'Charlotte Hornets', abbreviation: 'CHA', shortName: 'Hornets', logo: getLogoUrl('CHA') },
  bulls: { id: '4', name: 'Chicago Bulls', abbreviation: 'CHI', shortName: 'Bulls', logo: getLogoUrl('CHI') },
  cavaliers: { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', shortName: 'Cavaliers', logo: getLogoUrl('CLE') },
  mavs: { id: '6', name: 'Dallas Mavericks', abbreviation: 'DAL', shortName: 'Mavericks', logo: getLogoUrl('DAL') },
  nuggets: { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', shortName: 'Nuggets', logo: getLogoUrl('DEN') },
  pistons: { id: '8', name: 'Detroit Pistons', abbreviation: 'DET', shortName: 'Pistons', logo: getLogoUrl('DET') },
  warriors: { id: '9', name: 'Golden State Warriors', abbreviation: 'GSW', shortName: 'Warriors', logo: getLogoUrl('GSW') },
  rockets: { id: '10', name: 'Houston Rockets', abbreviation: 'HOU', shortName: 'Rockets', logo: getLogoUrl('HOU') },
  pacers: { id: '11', name: 'Indiana Pacers', abbreviation: 'IND', shortName: 'Pacers', logo: getLogoUrl('IND') },
  clippers: { id: '12', name: 'LA Clippers', abbreviation: 'LAC', shortName: 'Clippers', logo: getLogoUrl('LAC') },
  lakers: { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', shortName: 'Lakers', logo: getLogoUrl('LAL') },
  grizzlies: { id: '29', name: 'Memphis Grizzlies', abbreviation: 'MEM', shortName: 'Grizzlies', logo: getLogoUrl('MEM') },
  heat: { id: '14', name: 'Miami Heat', abbreviation: 'MIA', shortName: 'Heat', logo: getLogoUrl('MIA') },
  bucks: { id: '15', name: 'Milwaukee Bucks', abbreviation: 'MIL', shortName: 'Bucks', logo: getLogoUrl('MIL') },
  timberwolves: { id: '16', name: 'Minnesota Timberwolves', abbreviation: 'MIN', shortName: 'Timberwolves', logo: getLogoUrl('MIN') },
  pelicans: { id: '3', name: 'New Orleans Pelicans', abbreviation: 'NOP', shortName: 'Pelicans', logo: getLogoUrl('NOP') },
  knicks: { id: '18', name: 'New York Knicks', abbreviation: 'NYK', shortName: 'Knicks', logo: getLogoUrl('NYK') },
  thunder: { id: '25', name: 'Oklahoma City Thunder', abbreviation: 'OKC', shortName: 'Thunder', logo: getLogoUrl('OKC') },
  magic: { id: '19', name: 'Orlando Magic', abbreviation: 'ORL', shortName: 'Magic', logo: getLogoUrl('ORL') },
  '76ers': { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', shortName: '76ers', logo: getLogoUrl('PHI') },
  suns: { id: '21', name: 'Phoenix Suns', abbreviation: 'PHX', shortName: 'Suns', logo: getLogoUrl('PHX') },
  blazers: { id: '22', name: 'Portland Trail Blazers', abbreviation: 'POR', shortName: 'Trail Blazers', logo: getLogoUrl('POR') },
  kings: { id: '23', name: 'Sacramento Kings', abbreviation: 'SAC', shortName: 'Kings', logo: getLogoUrl('SAC') },
  spurs: { id: '24', name: 'San Antonio Spurs', abbreviation: 'SAS', shortName: 'Spurs', logo: getLogoUrl('SAS') },
  raptors: { id: '28', name: 'Toronto Raptors', abbreviation: 'TOR', shortName: 'Raptors', logo: getLogoUrl('TOR') },
  jazz: { id: '26', name: 'Utah Jazz', abbreviation: 'UTA', shortName: 'Jazz', logo: getLogoUrl('UTA') },
  wizards: { id: '27', name: 'Washington Wizards', abbreviation: 'WAS', shortName: 'Wizards', logo: getLogoUrl('WAS') },
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
