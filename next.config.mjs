/** @type {import('next').NextConfig} */
const nextConfig = {
    // produces .next/standalone for the Docker image
    output: "standalone",
    experimental: {
        // load pdf-parse from node_modules at runtime instead of bundling it
        serverComponentsExternalPackages: ["pdf-parse"],
    },
};

export default nextConfig;
