import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/lib/store';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nobar2026';

export async function GET() {
  return NextResponse.json(getConfig());
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-key');
  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const updated = setConfig(body);
  return NextResponse.json(updated);
}
