/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // /work was a listing page. The landing page is the portfolio now, so a
      // second list of the same case studies would only drift from the first.
      //
      // Permanent rather than a 404 because the URL has been handed out and
      // crawled, and the content genuinely moved rather than going away. Only
      // the exact path matches -- /work/<slug> is untouched, which is the point,
      // since those are what the landing links to.
      {
        source: "/work",
        destination: "/#work",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
