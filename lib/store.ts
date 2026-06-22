export interface NobarConfig {
  status: 'online' | 'offline';
  matchTitle: string;
  matchDescription: string;
  iframeCode: string;
  updatedAt: string;
}

// Default streaming status, configurable via env (NOBAR_DEFAULT_STATUS=online|offline)
// Falls back to 'online' if not set or invalid.
const envStatus = process.env.NOBAR_DEFAULT_STATUS;
const initialStatus: 'online' | 'offline' = envStatus === 'offline' ? 'offline' : 'online';

// Default iframe code, configurable via env (NOBAR_DEFAULT_IFRAME).
// Falls back to FOX USA embed if not set. This keeps the player visible
// even if in-memory config resets between serverless invocations
// (e.g. no Vercel KV configured).
const DEFAULT_IFRAME = '<iframe src="https://junkieembeds.pages.dev/embed/fox-usa" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
const initialIframe = process.env.NOBAR_DEFAULT_IFRAME || DEFAULT_IFRAME;

export const defaultConfig: NobarConfig = {
  status: initialStatus,
  matchTitle: 'FIFA World Cup 2026',
  matchDescription: '',
  iframeCode: initialIframe,
  updatedAt: new Date().toISOString(),
};

// Check if Vercel KV is available
function hasKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

const KV_KEY = 'nobar:config';

export async function getConfig(): Promise<NobarConfig> {
  if (hasKV()) {
    try {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get<NobarConfig>(KV_KEY);
      return data ?? defaultConfig;
    } catch (e) {
      console.error('KV get error:', e);
    }
  }
  // Fallback to in-memory (dev/no KV)
  return memStore;
}

export async function setConfig(config: Partial<NobarConfig>): Promise<NobarConfig> {
  const current = await getConfig();
  const updated: NobarConfig = { ...current, ...config, updatedAt: new Date().toISOString() };

  if (hasKV()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(KV_KEY, updated);
    } catch (e) {
      console.error('KV set error:', e);
    }
  }
  memStore = updated;
  return updated;
}

// In-memory fallback
let memStore: NobarConfig = { ...defaultConfig };
