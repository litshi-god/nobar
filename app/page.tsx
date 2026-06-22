'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type HlsType from 'hls.js';
import type { NobarConfig } from '@/lib/store';

type SourceKey = 'fox' | 'tcn' | 'bbc' | 'backup';

type SourceMap = Record<SourceKey, string>;

const SOURCE_PRESETS: SourceMap = {
  fox: '',
  tcn: '',
  bbc: '',
  backup: '',
};

const SOURCE_LABELS: Array<{ key: SourceKey; label: string }> = [
  { key: 'fox', label: 'FOX' },
  { key: 'tcn', label: 'TCN' },
  { key: 'bbc', label: 'BBC' },
  { key: 'backup', label: 'Backup' },
];

interface ChatMessage {
  id: number;
  username: string;
  text: string;
  time: string;
}

function BallIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m12 7 3.3 2.4-1.3 3.9h-4l-1.3-3.9L12 7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 7V3.5M15.3 9.4l3.4-1.1M14 13.3l2.1 3M10 13.3l-2.1 3M8.7 9.4 5.3 8.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BroadcastIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 9.5a5.7 5.7 0 0 0 0 5M5.1 6.8a9.5 9.5 0 0 0 0 10.4M16 9.5a5.7 5.7 0 0 1 0 5M18.9 6.8a9.5 9.5 0 0 1 0 10.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 14v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 3 9.9 9.9 3 13l6.9 3.1L13 23l3.1-6.9L23 13l-6.9-3.1L13 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m5 3 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 5 5.8v5.5c0 4.5 2.9 7.8 7 9.7 4.1-1.9 7-5.2 7-9.7V5.8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 11.7h7M10 8.7h4M10 14.7h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20.2c1.4-3.7 4-5.5 7.5-5.5s6.1 1.8 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 12 16-8-4.8 16-3.1-6.1L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m12.1 13.9 3.8-5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const player = video;

    let hls: HlsType | null = null;
    let cancelled = false;

    async function setupHls() {
      if (player.canPlayType('application/vnd.apple.mpegurl')) {
        player.src = src;
        return;
      }

      const HlsModule = await import('hls.js');
      const Hls = HlsModule.default;
      if (cancelled || !Hls.isSupported()) {
        player.src = src;
        return;
      }

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(player);
    }

    setupHls();

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
      player.removeAttribute('src');
      player.load();
    };
  }, [src]);

  return (
    <div className="argentina-player hls-player">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
      />
    </div>
  );
}

function EmbedPlayer({ code }: { code: string }) {
  const embedRef = useRef<HTMLDivElement>(null);
  const trimmedCode = code.trim();
  const isHlsSource = /^https?:\/\/.+\.m3u8($|\?)/i.test(trimmedCode);
  const isHtmlEmbed = trimmedCode.startsWith('<');
  const isIframeEmbed = /^<iframe[\s>]/i.test(trimmedCode);
  const srcMatch = isIframeEmbed ? trimmedCode.match(/src=["']([^"']+)["']/i) : null;
  const src = srcMatch ? srcMatch[1] : null;

  useEffect(() => {
    const node = embedRef.current;
    if (!node || !isHtmlEmbed || isIframeEmbed) return;

    const scripts = Array.from(node.querySelectorAll('script'));
    scripts.forEach(script => {
      const executableScript = document.createElement('script');
      Array.from(script.attributes).forEach(attribute => {
        executableScript.setAttribute(attribute.name, attribute.value);
      });
      executableScript.text = script.text;
      document.body.appendChild(executableScript);
    });
  }, [trimmedCode, isHtmlEmbed, isIframeEmbed]);

  if (isHlsSource) {
    return <HlsPlayer src={trimmedCode} />;
  }

  if (isHtmlEmbed && !isIframeEmbed) {
    return (
      <div
        ref={embedRef}
        className="embed-html argentina-player"
        dangerouslySetInnerHTML={{ __html: trimmedCode }}
      />
    );
  }

  if (!src) {
    return (
      <div
        className="embed-html argentina-player"
        dangerouslySetInnerHTML={{ __html: trimmedCode }}
      />
    );
  }

  return (
    <div className="argentina-player">
      <iframe
        src={src}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        scrolling="no"
        title="Live streaming"
      />
    </div>
  );
}

function FigureAssets({ figures }: { figures: string[] }) {
  const sortedFigures = [...figures].sort((a, b) => {
    if (a.endsWith('/4.png')) return -1;
    if (b.endsWith('/4.png')) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="figure-gallery" aria-hidden="true">
      {sortedFigures.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={`Argentina figure ${index + 1}`}
          className={src.endsWith('/4.png') ? 'figure-gallery-item figure-gallery-main' : 'figure-gallery-item'}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [config, setConfig] = useState<NobarConfig | null>(null);
  const [sources, setSources] = useState<SourceMap>(SOURCE_PRESETS);
  const [figures, setFigures] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceKey>('fox');
  const [usernameInput, setUsernameInput] = useState('');
  const [username, setUsername] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch {}
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources', { cache: 'no-store' });
      const data = await res.json();
      setSources({
        fox: data.fox || SOURCE_PRESETS.fox,
        tcn: data.tcn || SOURCE_PRESETS.tcn,
        bbc: data.bbc || SOURCE_PRESETS.bbc,
        backup: data.backup || SOURCE_PRESETS.backup,
      });
    } catch {}
  }, []);

  const fetchFigures = useCallback(async () => {
    try {
      const res = await fetch('/api/figures', { cache: 'no-store' });
      const data = await res.json();
      setFigures(Array.isArray(data.figures) ? data.figures : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchSources();
    fetchFigures();
    const configInterval = setInterval(fetchConfig, 10000);
    return () => clearInterval(configInterval);
  }, [fetchConfig, fetchSources, fetchFigures]);

  const activeIframeCode =
    selectedSource === 'backup'
      ? (config?.iframeCode || sources.backup)
      : sources[selectedSource];
  const isOnline = Boolean(activeIframeCode);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = usernameInput.trim().slice(0, 24);
    if (!cleanName) return;
    setUsername(cleanName);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const cleanText = chatInput.trim();
    if (!cleanText || !username) return;
    setMessages(current => [
      ...current,
      {
        id: Date.now(),
        username,
        text: cleanText.slice(0, 240),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  }

  return (
    <div className="argentina-page min-h-screen">
      <div className="sky-ribbon sky-ribbon-one" />
      <div className="sky-ribbon sky-ribbon-two" />

      <header className="argentina-header">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="brand-lockup" aria-label="Nobar Pildun">
            <span className="brand-mark">
              <BallIcon />
            </span>
            <span>
              <span className="brand-title">NOBAR PILDUN</span>
              <span className="brand-subtitle">Argentina supporters room</span>
            </span>
          </a>

          <div className={`stream-pill ${isOnline ? 'is-online' : 'is-offline'}`}>
            <BroadcastIcon />
            <span>{isOnline ? 'STREAMING ON' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-10">
        <section className="argentina-hero">
          <div className="hero-copy">
            <div className="hero-kicker">
              <ShieldIcon />
              <span>Albiceleste Mode</span>
            </div>
            <h1>{config?.matchTitle || 'FIFA World Cup 2026'}</h1>
            {config?.matchDescription ? (
              <p>{config.matchDescription}</p>
            ) : (
              <p>Frame streaming utama dengan atmosfer Argentina.</p>
            )}
            <div className="hero-badges" aria-label="Argentina themed details">
              <span><SparkIcon /> Light blue</span>
              <span><ShieldIcon /> Number 10</span>
              <span><BroadcastIcon /> Live room</span>
            </div>
          </div>

          {figures.length > 0 && <FigureAssets figures={figures} />}
        </section>

        <section className="stream-stage" aria-label="Live streaming frame">
          <div className="watch-grid">
            <div className="stream-frame-shell">
              <div className="frame-topbar">
                <div className="frame-lights">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="frame-title">
                  <BroadcastIcon />
                  <span>Live Match Frame</span>
                </div>
                <div className="frame-status">{isOnline ? 'ONLINE' : 'READY'}</div>
              </div>

              <div className="source-switcher" aria-label="Source selector">
                {SOURCE_LABELS.map(source => (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() => setSelectedSource(source.key)}
                    className={selectedSource === source.key ? 'is-active' : ''}
                  >
                    <BroadcastIcon />
                    <span>{source.label}</span>
                  </button>
                ))}
              </div>

              {activeIframeCode ? (
                <EmbedPlayer code={activeIframeCode} />
              ) : (
                <div className="argentina-player empty-player">
                  <BallIcon />
                </div>
              )}
            </div>

            <aside className="chat-panel" aria-label="Live chat">
              <div className="chat-header">
                <div>
                  <span className="chat-kicker">Live Chat</span>
                  <h2>Match Room</h2>
                </div>
                <UserIcon />
              </div>

              {!username ? (
                <form className="join-form" onSubmit={handleJoin}>
                  <label htmlFor="username">Pick a username to start chatting</label>
                  <input
                    id="username"
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="Username..."
                    maxLength={24}
                  />
                  <button type="submit">Join</button>
                </form>
              ) : (
                <>
                  <div className="chat-active-user">
                    <UserIcon />
                    <span>{username}</span>
                  </div>

                  <div className="chat-messages">
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <BroadcastIcon />
                        <span>Belum ada pesan.</span>
                      </div>
                    ) : (
                      messages.map(message => (
                        <div className="chat-message" key={message.id}>
                          <div className="chat-message-meta">
                            <strong>{message.username}</strong>
                            <span>{message.time}</span>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="chat-form" onSubmit={handleSend}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Tulis pesan..."
                      maxLength={240}
                    />
                    <button type="submit" aria-label="Send message">
                      <SendIcon />
                    </button>
                  </form>
                </>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
