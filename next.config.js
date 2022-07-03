/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'akamai',
    path: '',
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
