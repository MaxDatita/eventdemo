import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from './providers'
import { PreconnectLinks } from '@/components/preconnect-links'
import { theme } from '@/config/theme'
import { BackgroundLayer } from '@/components/ui/background-layer'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#471069',
}

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_BASE_URL 
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : new URL('https://eventdemo.vercel.app'),
  title: "Eventest - Invitación Digital",
  description: "Te invitamos a compartir una noche inolvidable",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: "Eventest - Invitación Digital",
    description: "Te invitamos a compartir una noche inolvidable",
    url: "https://invitacion-v2.eventechy.com/",
    siteName: "Eventest",
    images: [
      {
        url: "/banner.webp",
        width: 1200,
        height: 630,
        alt: "Eventest Preview",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventest - Invitación Digital",
    description: "Te invitamos a compartir una noche inolvidable",
    images: ["/banner.webp"],
    creator: "@eventest",
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const backgroundMode = theme.background?.mode || 'gradient'
  const auroraBaseColor = theme.background?.aurora?.baseColor || '#07070c'

  return (
    <html
      lang="es"
      className={`theme-bg-${backgroundMode}`}
      style={{ '--aurora-base-color': auroraBaseColor } as CSSProperties}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet" />
      </head>
      <body className={`theme-bg-${backgroundMode}`}>
        <BackgroundLayer />
        <div className="relative z-10">
          <PreconnectLinks />
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  );
}
