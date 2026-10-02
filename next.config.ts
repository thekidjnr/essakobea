import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Ponytails service used to have the slug "frontal-styling"
  async redirects() {
    return [
      // Payouts became Finance once the salon is paid out by Paystack directly
      { source: "/admin/payouts", destination: "/admin/finance", permanent: false },
      { source: "/works/frontal-styling", destination: "/works/ponytails", permanent: true },
      {
        source: "/book",
        has: [{ type: "query", key: "service", value: "frontal-styling" }],
        destination: "/book?service=ponytails",
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
