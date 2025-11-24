// NBA Team mapping: slug -> { id, name, abbreviation, shortName, logo, primaryColor }
// ESPN team IDs for NBA teams
// Logo URLs use ESPN's standard team logo format
const getLogoUrl = (abbreviation) => 
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation}.png`;

export const TEAMS = {
  hawks: { id: '1', name: 'Atlanta Hawks', abbreviation: 'ATL', shortName: 'Hawks', logo: getLogoUrl('ATL'), primaryColor: '#E03A3E' },
  celtics: { id: '2', name: 'Boston Celtics', abbreviation: 'BOS', shortName: 'Celtics', logo: getLogoUrl('BOS'), primaryColor: '#007A33' },
  nets: { id: '17', name: 'Brooklyn Nets', abbreviation: 'BKN', shortName: 'Nets', logo: getLogoUrl('BKN'), primaryColor: '#000000' },
  hornets: { id: '30', name: 'Charlotte Hornets', abbreviation: 'CHA', shortName: 'Hornets', logo: getLogoUrl('CHA'), primaryColor: '#1D1160' },
  bulls: { id: '4', name: 'Chicago Bulls', abbreviation: 'CHI', shortName: 'Bulls', logo: getLogoUrl('CHI'), primaryColor: '#CE1141' },
  cavaliers: { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', shortName: 'Cavaliers', logo: getLogoUrl('CLE'), primaryColor: '#860038' },
  mavs: { id: '6', name: 'Dallas Mavericks', abbreviation: 'DAL', shortName: 'Mavericks', logo: getLogoUrl('DAL'), primaryColor: '#00538C' },
  nuggets: { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', shortName: 'Nuggets', logo: getLogoUrl('DEN'), primaryColor: '#0E2240' },
  pistons: { id: '8', name: 'Detroit Pistons', abbreviation: 'DET', shortName: 'Pistons', logo: getLogoUrl('DET'), primaryColor: '#C8102E' },
  warriors: { id: '9', name: 'Golden State Warriors', abbreviation: 'GSW', shortName: 'Warriors', logo: getLogoUrl('GSW'), primaryColor: '#1D428A' },
  rockets: { id: '10', name: 'Houston Rockets', abbreviation: 'HOU', shortName: 'Rockets', logo: getLogoUrl('HOU'), primaryColor: '#CE1141' },
  pacers: { id: '11', name: 'Indiana Pacers', abbreviation: 'IND', shortName: 'Pacers', logo: getLogoUrl('IND'), primaryColor: '#002D62' },
  clippers: { id: '12', name: 'LA Clippers', abbreviation: 'LAC', shortName: 'Clippers', logo: getLogoUrl('LAC'), primaryColor: '#C8102E' },
  lakers: { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', shortName: 'Lakers', logo: getLogoUrl('LAL'), primaryColor: '#552583' },
  grizzlies: { id: '29', name: 'Memphis Grizzlies', abbreviation: 'MEM', shortName: 'Grizzlies', logo: getLogoUrl('MEM'), primaryColor: '#5D76A9' },
  heat: { id: '14', name: 'Miami Heat', abbreviation: 'MIA', shortName: 'Heat', logo: getLogoUrl('MIA'), primaryColor: '#98002E' },
  bucks: { id: '15', name: 'Milwaukee Bucks', abbreviation: 'MIL', shortName: 'Bucks', logo: getLogoUrl('MIL'), primaryColor: '#00471B' },
  timberwolves: { id: '16', name: 'Minnesota Timberwolves', abbreviation: 'MIN', shortName: 'Timberwolves', logo: getLogoUrl('MIN'), primaryColor: '#0C2340' },
  pelicans: { id: '3', name: 'New Orleans Pelicans', abbreviation: 'NOP', shortName: 'Pelicans', logo: getLogoUrl('NOP'), primaryColor: '#0C2340' },
  knicks: { id: '18', name: 'New York Knicks', abbreviation: 'NYK', shortName: 'Knicks', logo: getLogoUrl('NYK'), primaryColor: '#006BB6' },
  thunder: { id: '25', name: 'Oklahoma City Thunder', abbreviation: 'OKC', shortName: 'Thunder', logo: getLogoUrl('OKC'), primaryColor: '#007AC1' },
  magic: { id: '19', name: 'Orlando Magic', abbreviation: 'ORL', shortName: 'Magic', logo: getLogoUrl('ORL'), primaryColor: '#0077C0' },
  '76ers': { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', shortName: '76ers', logo: getLogoUrl('PHI'), primaryColor: '#006BB6' },
  suns: { id: '21', name: 'Phoenix Suns', abbreviation: 'PHX', shortName: 'Suns', logo: getLogoUrl('PHX'), primaryColor: '#1D1160' },
  blazers: { id: '22', name: 'Portland Trail Blazers', abbreviation: 'POR', shortName: 'Trail Blazers', logo: getLogoUrl('POR'), primaryColor: '#E03A3E' },
  kings: { id: '23', name: 'Sacramento Kings', abbreviation: 'SAC', shortName: 'Kings', logo: getLogoUrl('SAC'), primaryColor: '#5A2D81' },
  spurs: { id: '24', name: 'San Antonio Spurs', abbreviation: 'SAS', shortName: 'Spurs', logo: getLogoUrl('SAS'), primaryColor: '#C8102E' },
  raptors: { id: '28', name: 'Toronto Raptors', abbreviation: 'TOR', shortName: 'Raptors', logo: getLogoUrl('TOR'), primaryColor: '#CE1141' },
  jazz: { id: '26', name: 'Utah Jazz', abbreviation: 'UTA', shortName: 'Jazz', logo: getLogoUrl('UTA'), primaryColor: '#002B5C' },
  wizards: { id: '27', name: 'Washington Wizards', abbreviation: 'WAS', shortName: 'Wizards', logo: getLogoUrl('WAS'), primaryColor: '#002B5C' },
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
