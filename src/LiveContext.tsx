import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchPublicJson,
  FORECAST_URL,
  STATION_URL,
  parseForecast,
  parseObservation,
  formatTime,
  type Forecast,
  type Observation,
} from "./liveData";
type Resource<T> = {
  status: "loading" | "ready" | "error";
  data: T | null;
  error: string;
};
type LiveState = {
  observation: Resource<Observation>;
  forecast: Resource<Forecast>;
  refresh: () => void;
  refreshing: boolean;
};
const LiveContext = createContext<LiveState>({} as LiveState);
const pending = <T,>(): Resource<T> => ({
  status: "loading",
  data: null,
  error: "",
});
export function LiveProvider({ children }: { children: ReactNode }) {
  const [observation, setObservation] =
    useState<Resource<Observation>>(pending);
  const [forecast, setForecast] = useState<Resource<Forecast>>(pending);
  const [revision, setRevision] = useState(0);
  const latest = useRef(0);
  useEffect(() => {
    const generation = ++latest.current;
    const controller = new AbortController();
    setObservation(pending());
    setForecast(pending());
    const timeout = setTimeout(() => controller.abort(), 12000);
    const station = fetchPublicJson(STATION_URL, controller.signal)
      .then((raw) => {
        const data = parseObservation(raw);
        if (generation === latest.current)
          setObservation({ status: "ready", data, error: "" });
      })
      .catch(() => {
        if (generation === latest.current)
          setObservation({
            status: "error",
            data: null,
            error:
              "The IMGW station report could not be loaded. No replacement value is shown.",
          });
      });
    const model = fetchPublicJson(FORECAST_URL, controller.signal)
      .then((raw) => {
        const data = parseForecast(raw);
        if (generation === latest.current)
          setForecast({ status: "ready", data, error: "" });
      })
      .catch(() => {
        if (generation === latest.current)
          setForecast({
            status: "error",
            data: null,
            error:
              "A valid current forecast could not be loaded. Retry or open the source.",
          });
      });
    Promise.allSettled([station, model]).then(() => clearTimeout(timeout));
    const refresh = setInterval(
      () => setRevision((r) => r + 1),
      15 * 60 * 1000,
    );
    return () => {
      ++latest.current;
      controller.abort();
      clearTimeout(timeout);
      clearInterval(refresh);
    };
  }, [revision]);
  return (
    <LiveContext.Provider
      value={{
        observation,
        forecast,
        refresh: () => setRevision((r) => r + 1),
        refreshing:
          observation.status === "loading" || forecast.status === "loading",
      }}
    >
      {children}
    </LiveContext.Provider>
  );
}
export const useLive = () => useContext(LiveContext);
export function liveSummary(live: LiveState): string {
  const o = live.observation.data,
    f = live.forecast.data;
  return [
    o
      ? `IMGW-PIB station ${o.station} (${o.stationId}): ${o.temperature} °C; provider timestamp ${o.reportedTime} (timezone not specified in response). ${o.outdated ? "Older report; not current conditions. " : ""}Fetched ${o.fetchedAt}. Source: ${o.sourceUrl}`
      : "IMGW measurement unavailable when this snapshot was saved.",
    f
      ? `Open-Meteo seven-day forecast: highest daily maximum ${Math.max(...f.days.map((d) => d.max))} °C. Retrieved ${f.fetchedAt}. Numerical model output, not a station measurement or official warning. Source: ${f.sourceUrl}`
      : "Current forecast unavailable when this snapshot was saved.",
  ].join("\n");
}
export function LiveWeather({ compact = false }: { compact?: boolean }) {
  const live = useLive(),
    o = live.observation.data,
    f = live.forecast.data;
  return (
    <section
      className={`live-weather ${compact ? "live-compact" : ""}`}
      aria-label="Kraków current weather context"
    >
      <div className="live-heading">
        <span className="field-kicker">
          <span
            className={`live-dot ${live.observation.status === "ready" && !o?.outdated ? "" : "is-muted"}`}
          />
          KRAKÓW / LATEST AVAILABLE DATA
        </span>
        <button onClick={live.refresh} disabled={live.refreshing}>
          {live.refreshing ? "Updating…" : "Refresh ↻"}
        </button>
      </div>
      <div className="weather-reading">
        <div>
          <span className="weather-value">
            {o
              ? `${o.temperature.toFixed(1)}°`
              : live.observation.status === "loading"
                ? "…"
                : "—"}
          </span>
          <span className="weather-caption">
            {o?.outdated ? "Older station report" : "Station measurement"}
            <small>IMGW-PIB · Kraków · station 12566</small>
          </span>
        </div>
        {o ? (
          <p className="weather-timestamp">
            Reported {o.reportedTime}
            <br />
            <span>
              Provider timestamp; timezone not included. Retrieved{" "}
              {formatTime(o.fetchedAt)} Warsaw time.
            </span>
          </p>
        ) : (
          <p className="weather-timestamp" role="status">
            {live.observation.status === "error"
              ? live.observation.error
              : "Requesting the latest station report…"}
          </p>
        )}
      </div>
      {!compact && (
        <>
          <div className="forecast-heading">
            <strong>The next seven days</strong>
            <span>Forecast · °C / rainfall in mm</span>
          </div>
          {f ? (
            <div className="forecast-days">
              {f.days.map((d, i) => (
                <div key={d.time}>
                  <small>
                    {i === 0
                      ? "Today"
                      : new Date(d.time * 1000).toLocaleDateString("en-GB", {
                          weekday: "short",
                          timeZone: "Europe/Warsaw",
                        })}
                  </small>
                  <span
                    className="forecast-range"
                    style={{
                      height: `${Math.max(12, Math.min(45, (d.max - d.min) * 2))}px`,
                    }}
                  />
                  <strong>{Math.round(d.max)}°</strong>
                  <span>{Math.round(d.min)}°</span>
                  <small>{d.rain.toFixed(1)} mm</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="weather-timestamp" role="status">
              {live.forecast.status === "loading"
                ? "Requesting the current forecast…"
                : live.forecast.error}
            </p>
          )}
          {f && (
            <p className="forecast-note">
              {Math.max(...f.days.map((d) => d.max)) >= 30
                ? "The forecast includes a daily maximum of at least 30°C. This is weather context, not an official heat alert."
                : "A longer-term heat project can be explored even when the current forecast is mild."}{" "}
              Fetched {formatTime(f.fetchedAt)} (Warsaw).
            </p>
          )}
        </>
      )}
      <div className="live-sources">
        <a href={STATION_URL} target="_blank" rel="noreferrer">
          IMGW observation ↗
        </a>
        {!compact && (
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Forecast by Open-Meteo · CC BY 4.0 ↗
          </a>
        )}
      </div>
      {!compact && (
        <small className="weather-scope">
          Station conditions are not a neighbourhood heat map. The forecast is
          modelled; official weather warnings are not connected. Refreshes every
          15 minutes while open.
        </small>
      )}
    </section>
  );
}
