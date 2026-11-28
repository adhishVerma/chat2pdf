import { describe, expect, it } from "vitest";
import { demoConfig, isDemoEmail } from "@/lib/demo-config";

describe("demo account config", () => {
    it("is on by default with built-in credentials", () => {
        const cfg = demoConfig({});
        expect(cfg.enabled).toBe(true);
        expect(cfg.email).toBe("demo@chatpdf.app");
        expect(cfg.password.length).toBeGreaterThanOrEqual(8);
    });

    it("can be turned off or given other credentials", () => {
        expect(demoConfig({ DEMO_ACCOUNT: "false" }).enabled).toBe(false);
        expect(demoConfig({ DEMO_EMAIL: " Try@Example.com ", DEMO_PASSWORD: "secret-123" })).toMatchObject({ email: "try@example.com", password: "secret-123" });
    });

    it("recognises the demo email in any case, and nothing when off", () => {
        expect(isDemoEmail("DEMO@chatpdf.app", {})).toBe(true);
        expect(isDemoEmail("someone@example.com", {})).toBe(false);
        expect(isDemoEmail("demo@chatpdf.app", { DEMO_ACCOUNT: "false" })).toBe(false);
        expect(isDemoEmail(null, {})).toBe(false);
    });
});
