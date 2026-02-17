import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Build errors should be caught - do not ignore them
    ignoreBuildErrors: false
  }
}

export default withNextIntl(nextConfig)
