// Simple file-based store for Vercel (using JSON in /tmp or env)
// For production, replace with Vercel KV or a database

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

// In-memory store (resets on serverless cold start — use Vercel KV for persistence)
let memStore: NobarConfig = { ...defaultConfig };

export function getConfig(): NobarConfig {
  return memStore;
}

export function setConfig(config: Partial<NobarConfig>): NobarConfig {
  memStore = { ...memStore, ...config, updatedAt: new Date().toISOString() };
  return memStore;
}
