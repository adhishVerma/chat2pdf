import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/rate-limit";

const req = (headers: Record<string, string>) => new Request("http://x/", { headers });

describe("clientIp", () => {
    it("uses the address added by the proxy, not one the client sent", () => {
        // the client sent "6.6.6.6"; the proxy appended the real address
        expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }), {})).toBe("203.0.113.7");
        expect(clientIp(req({ "x-forwarded-for": "203.0.113.7" }), {})).toBe("203.0.113.7");
    });

    it("counts more proxies from the right when configured", () => {
        const h = req({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.5" });
        expect(clientIp(h, { TRUSTED_PROXY_COUNT: "2" })).toBe("203.0.113.7");
        // more hops than entries: the leftmost is the best we have
        expect(clientIp(h, { TRUSTED_PROXY_COUNT: "9" })).toBe("6.6.6.6");
    });

    it("falls back to X-Real-IP, then unknown", () => {
        expect(clientIp(req({ "x-real-ip": "198.51.100.1" }), {})).toBe("198.51.100.1");
        expect(clientIp(req({}), {})).toBe("unknown");
    });
});
