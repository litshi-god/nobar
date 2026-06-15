'use client';

import { useEffect, useState, useCallback } from 'react';
import type { NobarConfig } from '@/lib/store';

interface Game {
  id?: number;
  home_team?: { name?: string; flag?: string; code?: string };
  away_team?: { name?: string; flag?: string; code?: string };
  home_score?: number | null;
  away_score?: number | null;
  status?: string;
  date?: string;
  time?: string;
  group?: string;
  round?: string;
  stadium?: { name?: string; city?: string };
  minute?: number | null;
  kickoff_utc?: string;
}

interface Group {
  name?: string;
  teams?: Array<{
    name?: string;
    code?: string;
    played?: number;
    won?: number;
    drawn?: number;
    lost?: number;
    goals_for?: number;
    goals_against?: number;
    points?: number;
  }>;
}

function getStatusLabel(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'live' || s === 'in_play' || s === 'ht' || s === '1h' || s === '2h') return 'live';
  if (s === 'ft' || s === 'finished' || s === 'aet' || s === 'pen') return 'ft';
  return 'upcoming';
}

function getFlag(code?: string) {
  if (!code) return '🏴';
  const flagMap: Record<string, string> = {
    'BRA': '🇧🇷', 'ARG': '🇦🇷', 'FRA': '🇫🇷', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'GER': '🇩🇪',
    'ESP': '🇪🇸', 'POR': '🇵🇹', 'NED': '🇳🇱', 'BEL': '🇧🇪', 'ITA': '🇮🇹',
    'USA': '🇺🇸', 'MEX': '🇲🇽', 'CAN': '🇨🇦', 'JAP': '🇯🇵', 'KOR': '🇰🇷',
    'SEN': '🇸🇳', 'MAR': '🇲🇦', 'NGA': '🇳🇬', 'GHA': '🇬🇭', 'CMR': '🇨🇲',
    'URU': '🇺🇾', 'COL': '🇨🇴', 'CHI': '🇨🇱', 'ECU': '🇪🇨', 'PER': '🇵🇪',
    'AUS': '🇦🇺', 'NZL': '🇳🇿', 'IRN': '🇮🇷', 'SAU': '🇸🇦', 'QAT': '🇶🇦',
    'SRB': '🇷🇸', 'CRO': '🇭🇷', 'POL': '🇵🇱', 'DEN': '🇩🇰', 'SWE': '🇸🇪',
    'SUI': '🇨🇭', 'AUT': '🇦🇹', 'TUR': '🇹🇷', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'CZE': '🇨🇿', 'HUN': '🇭🇺', 'SVK': '🇸🇰', 'SVN': '🇸🇮', 'ALB': '🇦🇱',
    'UKR': '🇺🇦', 'RUS': '🇷🇺', 'ROU': '🇷🇴', 'GRE': '🇬🇷',
    'JPN': '🇯🇵',
  };
  return flagMap[code.toUpperCase()] || '🏴';
}

function ScoreCard({ game }: { game: Game }) {
  const statusType = getStatusLabel(game.status || '');
  const homeFlag = getFlag(game.home_team?.code);
  const awayFlag = getFlag(game.away_team?.code);
  const hasScore = game.home_score !== null && game.home_score !== undefined;

  const kickoffTime = game.kickoff_utc
    ? new Date(game.kickoff_utc).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
    : (game.time || '--:--');

  return (
    <div className="score-card p-4 hover:border-[#1e3a5f] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {statusType === 'live' && (
            <>
              <span className="live-dot" />
              <span className="badge-live">LIVE{game.minute ? ` ${game.minute}'` : ''}</span>
            </>
          )}
          {statusType === 'ft' && <span className="badge-ft">SELESAI</span>}
          {statusType === 'upcoming' && <span className="badge-upcoming">{kickoffTime}</span>}
        </div>
        <span className="text-xs text-[#64748b]">{game.group ? `Grup ${game.group}` : (game.round || '')}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="text-2xl mb-1">{homeFlag}</div>
          <div className="font-semibold text-sm text-[#e2e8f0]">{game.home_team?.name || 'TBD'}</div>
        </div>

        <div className="text-center px-3">
          {hasScore ? (
            <div className="text-2xl font-black text-[#F5C518]" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {game.home_score} – {game.away_score}
            </div>
          ) : (
            <div className="text-xl font-bold text-[#64748b]">VS</div>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="text-2xl mb-1">{awayFlag}</div>
          <div className="font-semibold text-sm text-[#e2e8f0]">{game.away_team?.name || 'TBD'}</div>
        </div>
      </div>

      {game.stadium && (
        <div className="mt-3 text-xs text-center text-[#64748b]">
          📍 {game.stadium.name}, {game.stadium.city}
        </div>
      )}
    </div>
  );
}

function GroupTable({ group }: { group: Group }) {
  return (
    <div className="score-card overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e3a5f]">
        <span className="font-bold text-[#F5C518] text-sm">GRUP {group.name}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#64748b]">
            <th className="text-left px-3 py-2">Tim</th>
            <th className="px-2 py-2 text-center">M</th>
            <th className="px-2 py-2 text-center">W</th>
            <th className="px-2 py-2 text-center">D</th>
            <th className="px-2 py-2 text-center">L</th>
            <th className="px-2 py-2 text-center">GF</th>
            <th className="px-2 py-2 text-center">GA</th>
            <th className="px-2 py-2 text-center font-bold text-[#F5C518]">Pts</th>
          </tr>
        </thead>
        <tbody>
          {(group.teams || []).map((t, i) => (
            <tr key={i} className={`border-t border-[#0f172a] ${i < 2 ? 'bg-[#0f2a1a]' : ''}`}>
              <td className="px-3 py-2 font-medium">{getFlag(t.code)} {t.name}</td>
              <td className="px-2 py-2 text-center text-[#94a3b8]">{t.played ?? 0}</td>
              <td className="px-2 py-2 text-center text-[#94a3b8]">{t.won ?? 0}</td>
              <td className="px-2 py-2 text-center text-[#94a3b8]">{t.drawn ?? 0}</td>
              <td className="px-2 py-2 text-center text-[#94a3b8]">{t.lost ?? 0}</td>
              <td className="px-2 py-2 text-center text-[#94a3b8]">{t.goals_for ?? 0}</td>
              <td className="px-2 py-2 text-center text-[#94a3b8]">{t.goals_against ?? 0}</td>
              <td className="px-2 py-2 text-center font-bold text-[#F5C518]">{t.points ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IframePlayer({ code }: { code: string }) {
  // Extract src from iframe string
  const srcMatch = code.match(/src=["']([^"']+)["']/i);
  const src = srcMatch ? srcMatch[1] : null;

  if (!src) {
    return (
      <div className="iframe-wrapper rounded-none" style={{ borderRadius: 0 }}
        dangerouslySetInnerHTML={{ __html: code }}
      />
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
      <iframe
        src={src}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        scrolling="no"
      />
    </div>
  );
}

export default function HomePage() {
  const [config, setConfig] = useState<NobarConfig | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'standings'>('live');
  const [lastUpdate, setLastUpdate] = useState('');
  const [loadingScores, setLoadingScores] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch {}
  }, []);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setGames(Array.isArray(data.games) ? data.games : []);
      setGroups(Array.isArray(data.groups) ? data.groups : []);
      setLastUpdate(new Date().toLocaleTimeString('id-ID'));
    } catch {}
    setLoadingScores(false);
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchScores();
    const configInterval = setInterval(fetchConfig, 10000);
    const scoresInterval = setInterval(fetchScores, 30000);
    return () => { clearInterval(configInterval); clearInterval(scoresInterval); };
  }, [fetchConfig, fetchScores]);

  const liveGames = games.filter(g => getStatusLabel(g.status || '') === 'live');
  const todayGames = games.filter(g => {
    if (!g.kickoff_utc) return false;
    const today = new Date().toDateString();
    return new Date(g.kickoff_utc).toDateString() === today;
  });
  const recentGames = games.filter(g => getStatusLabel(g.status || '') !== 'upcoming').slice(0, 6);
  const upcomingGames = games.filter(g => getStatusLabel(g.status || '') === 'upcoming').slice(0, 6);

  const displayGames = activeTab === 'live'
    ? (liveGames.length > 0 ? liveGames : recentGames)
    : activeTab === 'today'
    ? (todayGames.length > 0 ? todayGames : upcomingGames)
    : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(180deg, #060b15 0%, #0a0f1e 100%)', borderBottom: '1px solid #1e3a5f' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚽</div>
            <div>
              <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#F5C518', letterSpacing: '0.05em' }}>
                NOBAR PILDUN
              </h1>
              <p className="text-xs text-[#64748b]">FIFA World Cup 2026 • USA 🇺🇸 MEX 🇲🇽 CAN 🇨🇦</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                config.iframeCode
                  ? 'bg-[#003320] text-[#00C853] border border-[#00C853]/30'
                  : 'bg-[#1a0a0a] text-[#FF1744] border border-[#FF1744]/30'
              }`}>
                {config.iframeCode ? (
                  <><span className="live-dot" style={{ background: '#00C853' }} /> STREAMING ON</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-[#FF1744] inline-block" /> OFFLINE</>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Status Banner */}
        {config?.iframeCode ? (
          <div className="mb-8">
            <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #F5C518', boxShadow: '0 0 40px rgba(245,197,24,0.2)' }}>
              {/* Match header */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#0a0f1e', borderBottom: '1px solid #1e3a5f' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="live-dot" />
                    <span className="badge-live">LIVE NOW</span>
                  </div>
                  <h2 className="font-bold text-base text-white">{config.matchTitle}</h2>
                  {config.matchDescription && <p className="text-xs text-[#64748b]">{config.matchDescription}</p>}
                </div>
                <div className="text-right text-xs text-[#64748b]">
                  🔴 Nonton Bareng
                </div>
              </div>
              {/* Iframe */}
              <IframePlayer code={config.iframeCode} />
            </div>
            <p className="text-xs text-center text-[#64748b] mt-2">
              ⚠️ Jika stream tidak muncul, coba refresh halaman atau disable adblocker
            </p>
          </div>
        ) : null}

        {/* Live Score Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.25rem', color: '#F5C518' }}>
                LIVE SCORE
              </h2>
              {liveGames.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-[#FF1744] font-semibold">
                  <span className="live-dot" /> {liveGames.length} pertandingan live
                </span>
              )}
            </div>
            {lastUpdate && (
              <span className="text-xs text-[#64748b]">Update: {lastUpdate}</span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'live', label: `🔴 Live${liveGames.length > 0 ? ` (${liveGames.length})` : ''}` },
              { key: 'today', label: '📅 Hari Ini' },
              { key: 'standings', label: '📊 Klasemen' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'live' | 'today' | 'standings')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab.key ? '#F5C518' : '#111827',
                  color: activeTab === tab.key ? '#0a0f1e' : '#94a3b8',
                  border: activeTab === tab.key ? 'none' : '1px solid #1e3a5f',
                  fontWeight: activeTab === tab.key ? 700 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingScores ? (
            <div className="text-center py-16 text-[#64748b]">
              <div className="text-4xl mb-3 animate-spin">⚽</div>
              <p>Memuat data pertandingan...</p>
            </div>
          ) : activeTab === 'standings' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.length > 0 ? groups.map((g, i) => (
                <GroupTable key={i} group={g} />
              )) : (
                <div className="col-span-2 text-center py-12 text-[#64748b]">
                  Data klasemen belum tersedia
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayGames.length > 0 ? displayGames.map((g, i) => (
                <ScoreCard key={g.id || i} game={g} />
              )) : (
                <div className="col-span-3 text-center py-16 text-[#64748b]">
                  <div className="text-5xl mb-3">🏟️</div>
                  <p className="text-base">
                    {activeTab === 'live' ? 'Tidak ada pertandingan live saat ini' : 'Tidak ada pertandingan hari ini'}
                  </p>
                  <p className="text-sm mt-1 text-[#475569]">Cek jadwal lengkap di tab Hari Ini</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#1e3a5f] text-center text-xs text-[#475569]">
          <p>⚽ Nobar Pildun 2026 • FIFA World Cup USA/MEX/CAN</p>
        </footer>
      </main>
    </div>
  );
}
