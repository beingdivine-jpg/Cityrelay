import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicJson, parseForecast, parseObservation } from "./liveData";
const now = Date.parse("2026-10-03T14:10:00Z");
const station = () => ({
  id_stacji: "12566",
  stacja: "Kraków",
  data_pomiaru: "2026-10-03",
  godzina_pomiaru: "14",
  temperatura: "0",
});
const forecast = () => ({
  timezone: "Europe/Warsaw",
  daily_units: {
    time: "unixtime",
    temperature_2m_max: "°C",
    temperature_2m_min: "°C",
    precipitation_sum: "mm",
  },
  daily: {
    time: Array.from(
      { length: 7 },
      (_, i) => Date.parse("2026-10-02T22:00:00Z") / 1000 + i * 86400,
    ),
    temperature_2m_max: [20, 21, 22, 23, 22, 21, 20],
    temperature_2m_min: [10, 11, 12, 13, 12, 11, 10],
    precipitation_sum: [0, 0, 1, 2, 0, 3, 0],
  },
});
afterEach(() => vi.unstubAllGlobals());
describe("IMGW station measurements", () => {
  it("accepts zero, preserves provider time and records retrieval time separately", () => {
    const o = parseObservation(station(), now);
    expect(o.temperature).toBe(0);
    expect(o.reportedTime).toBe("2026-10-03 14:00");
    expect(o.fetchedAt).toBe("2026-10-03T14:10:00.000Z");
    expect(o.outdated).toBe(false);
  });
  it("rejects missing values, impossible dates and the wrong station", () => {
    for (const patch of [
      { temperatura: null },
      { temperatura: "" },
      { temperatura: "NaN" },
      { godzina_pomiaru: "24" },
      { id_stacji: "12345" },
      { data_pomiaru: "2026-02-31" },
    ])
      expect(() => parseObservation({ ...station(), ...patch }, now)).toThrow();
  });
  it("marks old reports so retrieval alone never implies current conditions", () => {
    expect(
      parseObservation({ ...station(), data_pomiaru: "2026-09-30" }, now)
        .outdated,
    ).toBe(true);
  });
});
describe("Current forecast validation", () => {
  it("uses calendar days across the Warsaw daylight-saving transition", () => {
    const f = forecast();
    f.daily.time = Array.from(
      { length: 7 },
      (_, i) => Date.UTC(2026, 9, 24 + i, i === 0 ? 22 : 23) / 1000,
    );
    expect(
      parseForecast(f, Date.parse("2026-10-24T22:30:00Z")).days,
    ).toHaveLength(7);
  });
  it("accepts a complete seven-day Warsaw forecast with zero rainfall", () => {
    const f = parseForecast(forecast(), now);
    expect(f.days).toHaveLength(7);
    expect(f.days[0].rain).toBe(0);
    expect(f.days[0].max).toBe(20);
  });
  it("rejects stale forecasts instead of substituting an example", () => {
    expect(() => parseForecast(forecast(), now + 86400000)).toThrow(
      "does not start today",
    );
  });
  it("rejects missing days, null measurements, wrong units and non-consecutive days", () => {
    const short = forecast();
    short.daily.time.pop();
    expect(() => parseForecast(short, now)).toThrow();
    const missing = forecast();
    (missing.daily.temperature_2m_max as unknown[])[2] = null;
    expect(() => parseForecast(missing, now)).toThrow();
    const units = forecast();
    units.daily_units.temperature_2m_min = "°F";
    expect(() => parseForecast(units, now)).toThrow();
    const gap = forecast();
    gap.daily.time[6] += 86400000;
    expect(() => parseForecast(gap, now)).toThrow();
  });
  it("surfaces an HTTP failure without parsing or returning a replacement", async () => {
    const json = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json }),
    );
    await expect(fetchPublicJson("https://example.org/public")).rejects.toThrow(
      "503",
    );
    expect(json).not.toHaveBeenCalled();
  });
});
