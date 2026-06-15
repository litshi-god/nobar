import { NextResponse } from 'next/server';

const API_BASE = 'https://worldcup26.ir';

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    // Try common wrapper keys
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'games', 'matches', 'results', 'items', 'groups']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // Try first array value found
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

export async function GET() {
  try {
    const [gamesRes, groupsRes] = await Promise.allSettled([
      fetch(`${API_BASE}/get/games`, { next: { revalidate: 30 } }),
      fetch(`${API_BASE}/get/groups`, { next: { revalidate: 60 } }),
    ]);

    let games: unknown[] = [];
    let groups: unknown[] = [];

    if (gamesRes.status === 'fulfilled' && gamesRes.value.ok) {
      const raw = await gamesRes.value.json();
      games = extractArray(raw);
    }

    if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
      const raw = await groupsRes.value.json();
      groups = extractArray(raw);
    }

    return NextResponse.json({ games, groups, fetchedAt: new Date().toISOString() });
  } catch (e) {
    console.error('Score fetch error:', e);
    return NextResponse.json({ games: [], groups: [], error: 'Failed to fetch scores' });
  }
}
