import { locale } from "./i18n";
export const STATION_URL =
  "https://danepubliczne.imgw.pl/api/data/synop/station/krakow";
export const FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=50.0614&longitude=19.9366&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FWarsaw&forecast_days=7&timeformat=unixtime";
export type Observation = {
  station: string;
  stationId: string;
  temperature: number;
  reportedTime: string;
  reportedDate: string;
  fetchedAt: string;
  sourceUrl: string;
  outdated: boolean;
};
export type ForecastDay = {
  time: number;
  max: number;
  min: number;
  rain: number;
};
export type Forecast = {
  days: ForecastDay[];
  fetchedAt: string;
  sourceUrl: string;
  timezone: string;
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const numeric = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))
      ? Number(v)
      : null;
export function parseObservation(raw: unknown, now = Date.now()): Observation {
  if (
    !object(raw) ||
    String(raw.id_stacji) !== "12566" ||
    raw.stacja !== "Kraków" ||
    typeof raw.data_pomiaru !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.data_pomiaru)
  )
    throw Error("Unexpected station response");
  const temp = numeric(raw.temperatura),
    hour = numeric(raw.godzina_pomiaru),
    day = Date.parse(raw.data_pomiaru + "T00:00:00Z");
  if (
    temp === null ||
    temp < -60 ||
    temp > 60 ||
    hour === null ||
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isFinite(day) ||
    new Date(day).toISOString().slice(0, 10) !== raw.data_pomiaru ||
    day > now + 86400000
  )
    throw Error("Invalid station values");
  // IMGW returns a date and hour without an explicit zone. Keep that raw
  // provider timestamp visible; do not relabel it as the browser's local time.
  return {
    station: raw.stacja,
    stationId: "12566",
    temperature: temp,
    reportedTime: `${raw.data_pomiaru} ${String(hour).padStart(2, "0")}:00`,
    reportedDate: raw.data_pomiaru,
    fetchedAt: new Date(now).toISOString(),
    sourceUrl: STATION_URL,
    outdated: now - (day + hour * 3600000) > 36 * 3600000,
  };
}
export function parseForecast(raw: unknown, now = Date.now()): Forecast {
  if (
    !object(raw) ||
    !object(raw.daily) ||
    !object(raw.daily_units) ||
    raw.timezone !== "Europe/Warsaw" ||
    raw.daily_units.temperature_2m_max !== "°C" ||
    raw.daily_units.temperature_2m_min !== "°C" ||
    raw.daily_units.time !== "unixtime" ||
    raw.daily_units.precipitation_sum !== "mm"
  )
    throw Error("Unexpected forecast response");
  const d = raw.daily;
  if (
    !Array.isArray(d.time) ||
    d.time.length !== 7 ||
    !Array.isArray(d.temperature_2m_max) ||
    !Array.isArray(d.temperature_2m_min) ||
    !Array.isArray(d.precipitation_sum) ||
    [d.temperature_2m_max, d.temperature_2m_min, d.precipitation_sum].some(
      (a) => a.length !== 7,
    )
  )
    throw Error("Incomplete seven-day forecast");
  const days = d.time.map((time, i) => ({
    time: numeric(time),
    max: numeric((d.temperature_2m_max as unknown[])[i]),
    min: numeric((d.temperature_2m_min as unknown[])[i]),
    rain: numeric((d.precipitation_sum as unknown[])[i]),
  }));
  if (
    days.some(
      (d, i) =>
        d.time === null ||
        d.max === null ||
        d.min === null ||
        d.rain === null ||
        d.max < -60 ||
        d.max > 65 ||
        d.min < -60 ||
        d.min > d.max ||
        d.rain < 0 ||
        (i > 0 && d.time <= (days[i - 1].time ?? 0)),
    )
  )
    throw Error("Invalid forecast values");
  const valid = days as ForecastDay[];
  const date = (time: number) =>
    new Date(time).toLocaleDateString("en-CA", { timeZone: "Europe/Warsaw" });
  if (date(valid[0].time * 1000) !== date(now))
    throw Error("Forecast does not start today");
  const calendarStart = Date.parse(date(now) + "T12:00:00Z");
  if (
    valid.some(
      (d, i) =>
        date(d.time * 1000) !==
        new Date(calendarStart + i * 86400000).toISOString().slice(0, 10),
    )
  )
    throw Error("Non-consecutive forecast days");
  return {
    days: valid,
    fetchedAt: new Date(now).toISOString(),
    sourceUrl: FORECAST_URL,
    timezone: "Europe/Warsaw",
  };
}
export async function fetchPublicJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) throw Error(`Provider returned ${response.status}`);
  return response.json();
}
export const formatTime = (time: string) =>
  new Date(time).toLocaleString(locale(), {
    timeZone: "Europe/Warsaw",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
