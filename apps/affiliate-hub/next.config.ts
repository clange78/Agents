import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives inside a larger monorepo; without this Next infers the
  // wrong workspace root from the parent lockfile.
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  images: {
    // Deal imagery is local (/public/img/deals). We never hotlink merchant CDNs
    // unless a program explicitly permits it — add remotePatterns here if one does.
    formats: ['image/webp'],
  },
};

export default nextConfig;
