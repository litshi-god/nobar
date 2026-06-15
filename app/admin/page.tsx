'use client';

import { useEffect, useState } from 'react';
import type { NobarConfig } from '@/lib/store';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [config, setConfig] = useState<NobarConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [form, setForm] = useState({
    status: 'offline' as 'online' | 'offline',
    matchTitle: '',
    matchDescription: '',
    iframeCode: '',
  });
  const [adminKey, setAdminKey] = useState('');

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const savedKey = sessionStorage.getItem('nobar_admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
      setAuthed(true);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Verify by trying to fetch with the key
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': password },
        body: JSON.stringify({}),
      });
      if (res.ok || res.status === 200) {
        setAdminKey(password);
        setAuthed(true);
        setLoginError('');
        sessionStorage.setItem('nobar_admin_key', password);
      } else {
        setLoginError('Password salah!');
      }
    } catch {
      // Try simple approach: fetch config and check if password matches
      setAdminKey(password);
      setAuthed(true);
      sessionStorage.setItem('nobar_admin_key', password);
    }
  }

  async function loadConfig() {
    const res = await fetch('/api/config');
    const data = await res.json();
    setConfig(data);
    setForm({
      status: data.status,
      matchTitle: data.matchTitle,
      matchDescription: data.matchDescription,
      iframeCode: data.iframeCode,
    });
  }

  useEffect(() => {
    if (authed) loadConfig();
  }, [authed]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSaveMsg('✅ Berhasil disimpan!');
      } else {
        setSaveMsg('❌ Gagal menyimpan. Password salah?');
      }
    } catch {
      setSaveMsg('❌ Error koneksi');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--darker)' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔐</div>
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.75rem', color: '#F5C518' }}>
              ADMIN PANEL
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Nobar Pildun 2026</p>
          </div>
          <form onSubmit={handleLogin} className="score-card p-6 space-y-4">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Password Admin</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                autoFocus
              />
            </div>
            {loginError && <p className="text-[#FF1744] text-sm">{loginError}</p>}
            <button type="submit" className="btn-primary w-full">
              Masuk
            </button>
            <p className="text-xs text-center text-[#475569]">
              Default: <code className="text-[#F5C518]">nobar2026</code> — ubah via env <code>ADMIN_PASSWORD</code>
            </p>
          </form>
          <div className="text-center mt-4">
            <a href="/" className="text-xs text-[#64748b] hover:text-[#F5C518]">← Kembali ke halaman utama</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--darker)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar w-56 flex-shrink-0">
        <div className="p-5 border-b border-[#1e3a5f]">
          <div className="text-2xl mb-1">⚽</div>
          <div style={{ fontFamily: 'Oswald, sans-serif', color: '#F5C518', fontSize: '1rem', fontWeight: 700 }}>
            NOBAR ADMIN
          </div>
          <div className="text-xs text-[#64748b] mt-0.5">Panel Kontrol</div>
        </div>
        <nav className="p-3 space-y-1">
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-all">
            🌐 Lihat Halaman Publik
          </a>
        </nav>
        <div className="absolute bottom-5 left-0 w-56 px-3">
          <button
            onClick={() => {
              setAuthed(false);
              setAdminKey('');
              sessionStorage.removeItem('nobar_admin_key');
            }}
            className="btn-outline w-full text-sm"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.5rem', color: '#F5C518' }}>
              PENGATURAN NOBAR
            </h2>
            {config && (
              <span className="text-xs text-[#475569]">
                Terakhir diupdate: {new Date(config.updatedAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Status Toggle */}
          <div className="score-card p-5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white mb-1">Status Layanan</div>
                <div className="text-sm text-[#64748b]">
                  {form.status === 'online'
                    ? '🟢 Pengunjung dapat menonton streaming'
                    : '🔴 Layanan offline — hanya live score yang ditampilkan'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#94a3b8]">
                  {form.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={form.status === 'online'}
                    onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'online' : 'offline' }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="score-card p-5 mb-4 space-y-4">
            <h3 className="font-semibold text-white border-b border-[#1e3a5f] pb-3">Info Pertandingan</h3>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Judul Pertandingan</label>
              <input
                type="text"
                value={form.matchTitle}
                onChange={e => setForm(f => ({ ...f, matchTitle: e.target.value }))}
                placeholder="Contoh: Brasil vs Argentina — Grup C"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Deskripsi / Info Tambahan</label>
              <input
                type="text"
                value={form.matchDescription}
                onChange={e => setForm(f => ({ ...f, matchDescription: e.target.value }))}
                placeholder="Contoh: Fase Grup — Estadio Azteca, Mexico City"
              />
            </div>
          </div>

          {/* Iframe Code */}
          <div className="score-card p-5 mb-4">
            <h3 className="font-semibold text-white border-b border-[#1e3a5f] pb-3 mb-4">Kode Iframe Streaming</h3>
            <div className="mb-2">
              <label className="block text-sm text-[#94a3b8] mb-2">Paste kode iframe di sini</label>
              <textarea
                rows={5}
                value={form.iframeCode}
                onChange={e => setForm(f => ({ ...f, iframeCode: e.target.value }))}
                placeholder={'<iframe src="https://junkieembeds.pages.dev/embed/fox-usa" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
              />
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              <span className="text-xs text-[#64748b]">Quick preset:</span>
              {[
                { label: 'FOX USA', code: '<iframe src="https://junkieembeds.pages.dev/embed/fox-usa" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>' },
                { label: 'ESPN', code: '<iframe src="https://junkieembeds.pages.dev/embed/espn" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>' },
                { label: 'BBC Sport', code: '<iframe src="https://junkieembeds.pages.dev/embed/bbc-sport" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => setForm(f => ({ ...f, iframeCode: p.code }))}
                  className="text-xs px-3 py-1 rounded border border-[#1e3a5f] text-[#94a3b8] hover:border-[#F5C518] hover:text-[#F5C518] transition-all"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setForm(f => ({ ...f, iframeCode: '' }))}
                className="text-xs px-3 py-1 rounded border border-[#2a1a1a] text-[#FF1744]/60 hover:border-[#FF1744] hover:text-[#FF1744] transition-all"
              >
                Hapus
              </button>
            </div>

            {/* Preview */}
            {form.iframeCode && (
              <div className="mt-4">
                <p className="text-xs text-[#64748b] mb-2">Preview iframe:</p>
                <div className="iframe-wrapper" dangerouslySetInnerHTML={{ __html: form.iframeCode }} />
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
              {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
            </button>
            {saveMsg && (
              <span className={`text-sm font-medium ${saveMsg.startsWith('✅') ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
                {saveMsg}
              </span>
            )}
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 rounded-lg border border-[#1e3a5f] bg-[#0a0f1e]">
            <p className="text-xs text-[#64748b] leading-relaxed">
              ℹ️ <strong className="text-[#94a3b8]">Catatan:</strong> Pengaturan disimpan di memori server. 
              Untuk persistensi permanen di Vercel, tambahkan <strong className="text-[#F5C518]">Vercel KV</strong> dan update <code className="text-[#F5C518]">lib/store.ts</code>.
              Password default dapat diubah via environment variable <code className="text-[#F5C518]">ADMIN_PASSWORD</code>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
