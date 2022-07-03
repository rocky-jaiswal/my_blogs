/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    images: {
      unoptimized: true,
    },
  },
  // async redirects() {
  //   return [
  //     {
  //       source: '/:year/:month/:date/:title',
  //       destination: '/:year/:month/:date/:title.html', // Matched parameters can be used in the destination
  //       permanent: false,
  //     },
  //   ]
  // },
}

module.exports = nextConfig
