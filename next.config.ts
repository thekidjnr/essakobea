import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Payouts became Finance once the salon is paid out by Paystack directly
      { source: "/admin/payouts", destination: "/admin/finance", permanent: false },
      // The shop isn't live yet: keep its pages off the public site until it is
      { source: "/shop", destination: "/", permanent: false },
      { source: "/shop/:path*", destination: "/", permanent: false },
      { source: "/bag", destination: "/", permanent: false },
      { source: "/checkout", destination: "/", permanent: false },
      { source: "/checkout/:path*", destination: "/", permanent: false },
      { source: "/admin/shop", destination: "/admin", permanent: false },
      { source: "/admin/orders", destination: "/admin", permanent: false },
      // Ponytails was split into Regular and Frontal Ponytails (migration 018)
      { source: "/works/frontal-styling", destination: "/works/regular-ponytails", permanent: true },
      { source: "/works/ponytails", destination: "/works/regular-ponytails", permanent: true },
      {
        source: "/book",
        has: [{ type: "query", key: "service", value: "(frontal-styling|ponytails)" }],
        destination: "/book?service=regular-ponytails",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
