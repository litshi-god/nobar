import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nobar Pildun 2026 🏆",
  description: "Nonton bareng FIFA World Cup 2026 — live streaming & live scores",
  openGraph: {
    title: "Nobar Pildun 2026 🏆",
    description: "Nonton bareng Piala Dunia FIFA 2026 dengan live score dan streaming",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Oswald:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
