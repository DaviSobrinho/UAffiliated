/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-9120b7afacb14a1dbbab64cbac5b062f.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-181f63ecb2d54193a12fc97ca65c1a4f.r2.dev",
      },
    ],
  },
};

module.exports = nextConfig;
