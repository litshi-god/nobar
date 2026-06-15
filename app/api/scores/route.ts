import { NextResponse } from 'next/server';

const API_BASE = 'https://worldcup26.ir';

export async function GET() {
  try {
    const [gamesRes, groupsRes] = await Promise.allSettled([
      fetch(`${API_BASE}/get/games`, { next: { revalidate: 30 } }),
      fetch(`${API_BASE}/get/groups`, { next: { revalidate: 60 } }),
    ]);

    let games = [];
    let groups = [];

    if (gamesRes.status === 'fulfilled' && gamesRes.value.ok) {
      const data = await gamesRes.value.json();
      games = data?.data || data || [];
    }

    if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
      const data = await groupsRes.value.json();
      groups = data?.data || data || [];
    }

    return NextResponse.json({ games, groups, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ games: [], groups: [], error: 'Failed to fetch scores' });
  }
}
