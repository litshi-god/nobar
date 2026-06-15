import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://worldcup26.ir/get/games');
    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    return NextResponse.json({
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      rawPreview: text.slice(0, 2000),
      parsed: parsed ? (Array.isArray(parsed) ? `Array(${parsed.length})` : Object.keys(parsed)) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
