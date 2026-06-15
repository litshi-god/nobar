export interface NobarConfig {
  status: 'online' | 'offline';
  matchTitle: string;
  matchDescription: string;
  iframeCode: string;
  updatedAt: string;
}

export const defaultConfig: NobarConfig = {
  status: 'offline',
  matchTitle: 'FIFA World Cup 2026',
  matchDescription: 'Pertandingan segera dimulai...',
  iframeCode: '',
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
