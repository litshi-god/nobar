import { existsSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIGURE_FILES = Array.from({ length: 7 }, (_, index) => `${index + 1}.png`);

export async function GET() {
  const publicDir = path.join(process.cwd(), 'public');
  const figures = FIGURE_FILES
    .filter(file => existsSync(path.join(publicDir, file)))
    .map(file => `/${file}`);

  return NextResponse.json({ figures });
}
