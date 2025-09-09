/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.APP_ENV === "production"
        ? "https://api.mysuperagent.io"
        : process.env.APP_ENV === "staging"
        ? "https://api-staging.mysuperagent.io"
        : "http://localhost:8888",
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              script-src 'self' 'unsafe-inline' 'unsafe-eval' 
              https://auth.privy.io 
              https://www.googletagmanager.com 
              https://www.google-analytics.com
              https://ssl.google-analytics.com
              https://connect.facebook.net
              https://snap.licdn.com
              https://static.ads-twitter.com
              https://analytics.twitter.com
              https://t.co
              https://px.ads.linkedin.com
              https://vitals.vercel-insights.com
              https://va.vercel-scripts.com;
              connect-src 'self' 
              https://auth.privy.io 
              https://api.privy.io 
              https://www.google-analytics.com 
              https://api.mysuperagent.io
              https://api-staging.mysuperagent.io
              https://api.web3modal.org
              https://pulse.walletconnect.org
              https://explorer-api.walletconnect.com
              https://rpc.walletconnect.com
              https://relay.walletconnect.com
              https://verify.walletconnect.com
              https://va.vercel-scripts.com
              http://localhost:8888
              http://localhost:3000
              ws://localhost:3002
              wss://localhost:3002;
              img-src 'self' data: blob: 
              https://auth.privy.io 
              https://www.google-analytics.com
              https://www.googletagmanager.com
              https://explorer-api.walletconnect.com
              https://imagedelivery.net;
              style-src 'self' 'unsafe-inline'
              https://fonts.googleapis.com;
              font-src 'self' data:
              https://fonts.gstatic.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
  }
};

module.exports = nextConfig;
