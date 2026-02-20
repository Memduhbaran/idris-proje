/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev modda chunk yolu uyumsuzluğunu azaltmak için webpack cache kapatılıyor
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
