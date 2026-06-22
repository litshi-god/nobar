import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeEmbed(value: string | undefined) {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('<')) return raw;
  if (/\.m3u8($|\?)/i.test(raw)) return raw;

  return `<iframe src="${raw}" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
}

export async function GET() {
  return NextResponse.json({
    fox: normalizeEmbed(process.env.NOBAR_SOURCE_FOX),
    tcn: normalizeEmbed(process.env.NOBAR_SOURCE_TCN),
    bbc: normalizeEmbed(process.env.NOBAR_SOURCE_BBC),
    backup: normalizeEmbed(process.env.NOBAR_SOURCE_BACKUP || process.env.NOBAR_DEFAULT_IFRAME),
  });
}
