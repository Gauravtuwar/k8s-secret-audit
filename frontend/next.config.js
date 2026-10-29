/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const rawBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!rawBackend) {
      if (process.env.NODE_ENV !== 'production') {
        return [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8000/api/:path*',
          },
        ];
      }
      return [];
    }
    const cleanBackend = rawBackend.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${cleanBackend}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
