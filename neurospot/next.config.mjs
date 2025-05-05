/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  // Asegura que la aplicación funcione correctamente cuando se despliega en una subcarpeta
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Deshabilita la necesidad de un servidor Node.js
  trailingSlash: true,
}

export default nextConfig
