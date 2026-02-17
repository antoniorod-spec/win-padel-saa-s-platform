import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { Providers } from '@/components/providers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, setRequestLocale } from 'next-intl/server'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'WhinPadel - Plataforma de Torneos de Padel',
  description: 'Gestiona torneos, rankings y clubes de padel en una sola plataforma profesional.',
  metadataBase: new URL(siteUrl),
}

export const viewport: Viewport = {
  themeColor: '#00C853',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // RootLayout is a Server Component; get locale/messages server-side.
  // This is supported by next-intl when used with `middleware.ts`.
  const locale = await getLocale()
  // Make sure Next.js caches/rendering vary by locale (important with middleware-based routing).
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">
        {/* Key forces a remount when locale changes via client navigation */}
        <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
