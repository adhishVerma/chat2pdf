import { describe, expect, it } from "vitest";
import { isCrossSiteWrite } from "@/lib/csrf";

const req = (method: string, headers: Record<string, string>) =>
    new Request("http://app.example.com/api/chat", { method, headers: { host: "app.example.com", ...headers } });

describe("cross-site write check", () => {
    it("allows same-origin writes", () => {
        expect(isCrossSiteWrite(req("POST", { origin: "http://app.example.com", "sec-fetch-site": "same-origin" }), {})).toBe(false);
    });

    it("refuses writes from another site", () => {
        expect(isCrossSiteWrite(req("POST", { origin: "https://evil.example" }), {})).toBe(true);
        expect(isCrossSiteWrite(req("DELETE", { "sec-fetch-site": "cross-site" }), {})).toBe(true);
        expect(isCrossSiteWrite(req("POST", { "sec-fetch-site": "same-site", origin: "https://other.example.com" }), {})).toBe(true);
        expect(isCrossSiteWrite(req("POST", { origin: "null" }), {})).toBe(true);
    });

    it("never blocks reads", () => {
        expect(isCrossSiteWrite(req("GET", { origin: "https://evil.example", "sec-fetch-site": "cross-site" }), {})).toBe(false);
    });

    it("lets non-browser clients through (no Origin, no Sec-Fetch-Site)", () => {
        expect(isCrossSiteWrite(req("POST", {}), {})).toBe(false);
    });

    it("accepts the public origin from APP_URL or X-Forwarded-Host behind a proxy", () => {
        const behindProxy = new Request("http://app:3000/api/chat", {
            method: "POST",
            headers: { host: "app:3000", origin: "https://chat.example.com" },
        });
        expect(isCrossSiteWrite(behindProxy, {})).toBe(true);
        expect(isCrossSiteWrite(behindProxy, { APP_URL: "https://chat.example.com" })).toBe(false);
        const forwarded = new Request("http://app:3000/api/chat", {
            method: "POST",
            headers: { host: "app:3000", "x-forwarded-host": "chat.example.com", origin: "https://chat.example.com" },
        });
        expect(isCrossSiteWrite(forwarded, {})).toBe(false);
    });
});
