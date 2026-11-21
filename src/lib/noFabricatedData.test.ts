import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

/**
 * Rule: the app must never write invented fleet records.
 * The GPS / fuel-card / maintenance "integrations" have no live provider behind
 * them, so they must save what the user enters and import nothing on their own.
 */
describe("integration handler writes no fabricated fleet data", () => {
  const src = read("supabase/functions/handle-integration/index.ts");

  test("contains no simulated transaction or schedule data", () => {
    expect(src).not.toContain("mockTransactions");
    expect(src).not.toContain("mockSchedules");
    expect(src).not.toContain("For demo purposes");
  });

  test("never inserts into the fuel log or maintenance schedule", () => {
    const fuelInsert = /\.from\(\s*['"]fuel_logs['"]\s*\)\s*\.insert/s;
    const maintenanceInsert = /\.from\(\s*['"]maintenance_schedules['"]\s*\)\s*\.insert/s;
    expect(fuelInsert.test(src)).toBe(false);
    expect(maintenanceInsert.test(src)).toBe(false);
  });

  test("tags saved integrations with the owning company", () => {
    expect(src).toContain("company_id: companyId");
  });
});

describe("maintenance provider screen offers no invented providers", () => {
  const src = read("src/components/vehicle/MaintenanceProviderIntegration.tsx");

  test("does not hardcode a provider list", () => {
    expect(src).not.toContain("AutoCare Services");
    expect(src).not.toContain("TireWorks");
    expect(src).not.toContain("ElectricalExperts");
    expect(src).not.toContain("FastLube");
    expect(src).not.toContain("Simulate API call");
  });
});
