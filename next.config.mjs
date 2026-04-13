/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging: {
    browserToTerminal: true,
  },
  allowedDevOrigins: ['10.0.2.2', '192.168.123.107'],
}

export default nextConfig
