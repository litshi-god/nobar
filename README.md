# ⚽ Nobar

Web nonton bareng FIFA World Cup 2026 dengan live score, live stats, dan admin panel.

## 🚀 Deploy ke Vercel

1. Push repo ini ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Tambahkan environment variable:
   ```
   ADMIN_PASSWORD=passwordkamu
   ```
4. Deploy!

## 🎛️ Admin Panel

Akses di: `yourdomain.com/admin`

**Fitur admin:**
- Toggle status **ONLINE / OFFLINE**
- Set judul & deskripsi pertandingan yang sedang diputar
- Paste kode iframe streaming (contoh: Fox USA, ESPN, dll)
- Preview iframe sebelum disimpan

## 📡 Live Score API

Menggunakan API dari [worldcup26.ir](https://worldcup26.ir):
- `/get/games` — semua pertandingan & live score
- `/get/groups` — klasemen grup

Data di-refresh otomatis setiap 30 detik.

## 💾 Persistensi Data (Upgrade)

Secara default config disimpan di memory server (reset saat cold start di Vercel).

Untuk persistensi permanen, tambahkan **Vercel KV**:
1. Buka Vercel Dashboard > Storage > Create KV Database
2. Update `lib/store.ts` untuk menggunakan `@vercel/kv`

```bash
npm install @vercel/kv
```

## 🛠️ Development

```bash
npm install
npm run dev
```

Akses di `http://localhost:3000`
Admin panel di `http://localhost:3000/admin`
