import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow local IPs in development (Next.js 16 blocks private IPs by default)
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "fzsdaqpwwbuwkvbzyiax.supabase.co", // test env.
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "bzfnqhghtmsiecvvgmkw.supabase.co", // prod env.
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
