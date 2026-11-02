import { json } from './http.js';

const STANDINGS_URL = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

// ESPN's standings payload is ~165KB (it lists every past season), so slim it
// down to { records: { [teamId]: "W-L" } } before sending it to the client.
export const parseStandingsRecords = (data) => {
  const records = {};
  for (const group of data?.children ?? []) {
    for (const entry of group?.standings?.entries ?? []) {
      const id = entry?.team?.id;
      const overall = entry?.stats?.find((stat) => stat.type === 'total' || stat.name === 'overall');
      if (id && overall?.displayValue) records[id] = overall.displayValue;
    }
  }
  return records;
};

export default async function standings() {
  try {
    const response = await fetch(STANDINGS_URL, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!response.ok) throw new Error(`ESPN standings request failed (${response.status})`);
    const records = parseStandingsRecords(await response.json());
    return json({ records }, 200, 'public, max-age=300');
  } catch (error) {
    console.error('Standings proxy failed', error);
    return json({ error: 'Failed to fetch standings data' }, 502);
  }
}
