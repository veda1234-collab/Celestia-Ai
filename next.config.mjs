/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // pdfkit reads its built-in font metrics from disk at runtime; keep it external
  // so those files resolve from node_modules instead of being bundled.
  serverExternalPackages: ['pdfkit', '@prisma/client', 'jsonwebtoken', 'bcryptjs'],
  // Astrology math + AI provider run server-side only; keep the client bundle lean.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(self), microphone=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
