import { describe, expect, it } from "vitest";
import { applySecurityHeaders, buildCsp, s3Origin } from "@/lib/security-headers";

describe("security headers", () => {
    it("works out the S3 origin from the bucket and region, or a custom endpoint", () => {
        expect(s3Origin({ S3_BUCKET_NAME: "docs", S3_REGION: "eu-west-1" })).toBe("https://docs.s3.eu-west-1.amazonaws.com");
        expect(s3Origin({ S3_BUCKET_NAME: "docs" })).toBe("https://docs.s3.ap-south-1.amazonaws.com");
        expect(s3Origin({ S3_ENDPOINT: "http://localhost:9000/", S3_BUCKET_NAME: "docs" })).toBe("http://localhost:9000");
        expect(s3Origin({})).toBeNull();
    });

    it("lets the browser upload to and frame S3, and nothing else", () => {
        const csp = buildCsp({ S3_BUCKET_NAME: "docs", NODE_ENV: "production" });
        expect(csp).toContain("connect-src 'self' https://docs.s3.ap-south-1.amazonaws.com");
        expect(csp).toContain("frame-src 'self' https://docs.s3.ap-south-1.amazonaws.com");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("object-src 'none'");
        expect(csp).not.toContain("unsafe-eval");
    });

    it("allows eval and websockets only in development", () => {
        const csp = buildCsp({ NODE_ENV: "development" });
        expect(csp).toContain("'unsafe-eval'");
        expect(csp).toContain("ws:");
    });

    it("sets all headers", () => {
        const h = new Headers();
        applySecurityHeaders(h, { S3_BUCKET_NAME: "docs" });
        expect(h.get("X-Content-Type-Options")).toBe("nosniff");
        expect(h.get("X-Frame-Options")).toBe("DENY");
        expect(h.get("Content-Security-Policy")).toContain("default-src 'self'");
    });
});
