import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'games', 'matches', 'results', 'items', 'groups', 'standings']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

// Normalize openfootball match format → our format
function normalizeOpenFootball(matches: unknown[]): unknown[] {
  return matches.map((m: unknown) => {
    const match = m as Record<string, unknown>;
    const score = match.score as Record<string, unknown> | undefined;
    const ft = score?.ft as number[] | undefined;
    const hasScore = Array.isArray(ft) && ft.length === 2;

    // Determine status
    let status = 'upcoming';
    if (hasScore) status = 'ft';

    const team1 = match.team1 as string || 'TBD';
    const team2 = match.team2 as string || 'TBD';

    return {
      id: `${match.date}-${team1}-${team2}`,
      home_team: { name: team1, code: teamCode(team1) },
      away_team: { name: team2, code: teamCode(team2) },
      home_score: hasScore ? ft![0] : null,
      away_score: hasScore ? ft![1] : null,
      status,
      kickoff_utc: match.date ? `${match.date}T${parseTime(match.time as string)}` : null,
      group: match.group as string || null,
      round: match.round as string || null,
      stadium: match.ground ? { name: match.ground as string, city: match.ground as string } : null,
    };
  });
}

function parseTime(time: string): string {
  if (!time) return '00:00:00Z';
  // Format: "13:00 UTC-6" → convert to UTC
  const match = time.match(/(\d+):(\d+)\s*UTC([+-]\d+)?/);
  if (match) {
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const offset = parseInt(match[3] || '0');
    const utcH = ((h - offset) % 24 + 24) % 24;
    return `${String(utcH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`;
  }
  return '00:00:00Z';
}

const TEAM_CODES: Record<string, string> = {
  'Brazil': 'BRA', 'Argentina': 'ARG', 'France': 'FRA', 'England': 'ENG',
  'Germany': 'GER', 'Spain': 'ESP', 'Portugal': 'POR', 'Netherlands': 'NED',
  'Belgium': 'BEL', 'Italy': 'ITA', 'United States': 'USA', 'USA': 'USA',
  'Mexico': 'MEX', 'Canada': 'CAN', 'Japan': 'JPN', 'South Korea': 'KOR',
  'Senegal': 'SEN', 'Morocco': 'MAR', 'Nigeria': 'NGA', 'Ghana': 'GHA',
  'Uruguay': 'URU', 'Colombia': 'COL', 'Chile': 'CHI', 'Ecuador': 'ECU',
  'Australia': 'AUS', 'Iran': 'IRN', 'Saudi Arabia': 'SAU', 'Qatar': 'QAT',
  'Serbia': 'SRB', 'Croatia': 'CRO', 'Poland': 'POL', 'Denmark': 'DEN',
  'Sweden': 'SWE', 'Switzerland': 'SUI', 'Austria': 'AUT', 'Turkey': 'TUR',
  'Czech Republic': 'CZE', 'Hungary': 'HUN', 'Slovakia': 'SVK', 'Slovenia': 'SVN',
  'Albania': 'ALB', 'Ukraine': 'UKR', 'Romania': 'ROU', 'Greece': 'GRE',
  'South Africa': 'RSA', 'Cameroon': 'CMR', 'Mali': 'MLI', 'Egypt': 'EGY',
  'Honduras': 'HON', 'Costa Rica': 'CRC', 'Panama': 'PAN', 'Jamaica': 'JAM',
  'Venezuela': 'VEN', 'Paraguay': 'PAR', 'Bolivia': 'BOL', 'Peru': 'PER',
  'New Zealand': 'NZL', 'Indonesia': 'IDN', 'Thailand': 'THA',
};

function teamCode(name: string): string {
  return TEAM_CODES[name] || name.slice(0, 3).toUpperCase();
}

// Normalize worldcup26.ir format
function normalizeWC26(games: unknown[]): unknown[] {
  return games.map((g: unknown) => {
    const game = g as Record<string, unknown>;
    // Handle nested team objects vs string names
    const homeTeam = game.home_team ?? game.homeTeam ?? game.team1;
    const awayTeam = game.away_team ?? game.awayTeam ?? game.team2;

    const homeName = typeof homeTeam === 'string' ? homeTeam
      : (homeTeam as Record<string, unknown>)?.name as string || 'TBD';
    const awayName = typeof awayTeam === 'string' ? awayTeam
      : (awayTeam as Record<string, unknown>)?.name as string || 'TBD';
    const homeCode = typeof homeTeam === 'object'
      ? (homeTeam as Record<string, unknown>)?.code as string || teamCode(homeName)
      : teamCode(homeName);
    const awayCode = typeof awayTeam === 'object'
      ? (awayTeam as Record<string, unknown>)?.code as string || teamCode(awayName)
      : teamCode(awayName);

    const stadium = game.stadium ?? game.venue;
    const stadiumName = typeof stadium === 'string' ? stadium
      : (stadium as Record<string, unknown>)?.name as string || null;
    const stadiumCity = typeof stadium === 'string' ? stadium
      : (stadium as Record<string, unknown>)?.city as string || null;

    return {
      id: game.id ?? game._id,
      home_team: { name: homeName, code: homeCode },
      away_team: { name: awayName, code: awayCode },
      home_score: game.home_score ?? game.homeScore ?? game.score1 ?? null,
      away_score: game.away_score ?? game.awayScore ?? game.score2 ?? null,
      status: game.status ?? 'upcoming',
      kickoff_utc: game.kickoff_utc ?? game.date ?? game.datetime ?? null,
      group: game.group ?? game.group_name ?? null,
      round: game.round ?? game.stage ?? null,
      minute: game.minute ?? game.elapsed ?? null,
      stadium: stadiumName ? { name: stadiumName, city: stadiumCity } : null,
    };
  });
}

// Normalize openfootball groups
function buildGroupsFromMatches(matches: unknown[]): unknown[] {
  const groups: Record<string, Record<string, { name: string; code: string; played: number; won: number; drawn: number; lost: number; goals_for: number; goals_against: number; points: number }>> = {};

  for (const m of matches) {
    const match = m as Record<string, unknown>;
    const groupName = (match.group as string || '').replace('Group ', '');
    if (!groupName) continue;

    const score = match.score as Record<string, unknown> | undefined;
    const ft = score?.ft as number[] | undefined;
    const hasScore = Array.isArray(ft) && ft.length === 2;

    const home = match.home_team as Record<string, unknown>;
    const away = match.away_team as Record<string, unknown>;
    if (!home || !away) continue;

    if (!groups[groupName]) groups[groupName] = {};

    for (const [team, isHome] of [[home, true], [away, false]] as const) {
      const key = team.code as string;
      if (!groups[groupName][key]) {
        groups[groupName][key] = { name: team.name as string, code: key, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };
      }
      if (hasScore) {
        const gf = isHome ? ft![0] : ft![1];
        const ga = isHome ? ft![1] : ft![0];
        groups[groupName][key].played++;
        groups[groupName][key].goals_for += gf;
        groups[groupName][key].goals_against += ga;
        if (gf > ga) { groups[groupName][key].won++; groups[groupName][key].points += 3; }
        else if (gf === ga) { groups[groupName][key].drawn++; groups[groupName][key].points += 1; }
        else { groups[groupName][key].lost++; }
      }
    }
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, teams]) => ({
      name,
      teams: Object.values(teams).sort((a, b) => b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against)),
    }));
}

export async function GET() {
  // Try worldcup26.ir first
  try {
    const [gamesRes, groupsRes] = await Promise.allSettled([
      fetch('https://worldcup26.ir/get/games', { next: { revalidate: 30 } }),
      fetch('https://worldcup26.ir/get/groups', { next: { revalidate: 60 } }),
    ]);

    let games: unknown[] = [];
    let groups: unknown[] = [];
    let gotGames = false;

    if (gamesRes.status === 'fulfilled' && gamesRes.value.ok) {
      const raw = await gamesRes.value.json();
      const arr = extractArray(raw);
      if (arr.length > 0) {
        games = normalizeWC26(arr);
        gotGames = true;
      }
    }

    if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
      const raw = await groupsRes.value.json();
      const arr = extractArray(raw);
      if (arr.length > 0) groups = arr;
    }

    if (gotGames) {
      return NextResponse.json({ games, groups, source: 'worldcup26.ir', fetchedAt: new Date().toISOString() });
    }
  } catch (e) {
    console.error('worldcup26.ir failed:', e);
  }

  // Fallback: openfootball (no auth needed)
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const raw = await res.json();
      const matches: unknown[] = raw.matches || [];
      const normalized = normalizeOpenFootball(matches);
      const groups = buildGroupsFromMatches(normalized);
      return NextResponse.json({ games: normalized, groups, source: 'openfootball', fetchedAt: new Date().toISOString() });
    }
  } catch (e) {
    console.error('openfootball fallback failed:', e);
  }

  return NextResponse.json({ games: [], groups: [], error: 'All sources failed', fetchedAt: new Date().toISOString() });
}
