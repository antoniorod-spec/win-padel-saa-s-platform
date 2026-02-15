import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { Providers } from '@/components/providers'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'WinPadel - Plataforma de Torneos de Padel',
  description: 'Gestiona torneos, rankings y clubes de padel en una sola plataforma profesional.',
}

export const viewport: Viewport = {
  themeColor: '#00C853',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
