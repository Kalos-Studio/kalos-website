/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The WebGL hero lived at /lab for its whole prototype life, and the point
      // of shipping it to production was so it could be opened on a real phone —
      // which means the URL is sitting in messages and browser history. It's the
      // homepage now, so send those there rather than 404ing them.
      { source: "/lab", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
