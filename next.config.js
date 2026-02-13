/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Usa loader customizado para permitir qualquer URL
    loader: 'custom',
    loaderFile: './imageLoader.js',
  },
}

module.exports = nextConfig

