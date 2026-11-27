/** @type {import('next').NextConfig} */
const nextConfig = {
    // produces .next/standalone for the Docker image
    output: "standalone",
    // load pdf-parse from node_modules at runtime instead of bundling it
    serverExternalPackages: ["pdf-parse"],
    poweredByHeader: false,
    // static files skip the middleware, so give them the basic headers here.
    // Keep in sync with STATIC_SECURITY_HEADERS in src/lib/security-headers.ts.
    async headers() {
        return [{
            source: "/:path*",
            headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            ],
        }];
    },
};

export default nextConfig;
