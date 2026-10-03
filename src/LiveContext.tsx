import { t as tr, locale } from "./i18n";
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
          setObservation({
            status: "ready",
            data,
            error: "",
          });
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
          setForecast({
            status: "ready",
            data,
            error: "",
          });
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
      {tr(children)}
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
      aria-label={tr("Kraków current weather context")}
    >
      <div className="live-heading">
        <span className="field-kicker">
          <span
            className={`live-dot ${live.observation.status === "ready" && !o?.outdated ? "" : "is-muted"}`}
          />
          {tr("KRAKÓW / LATEST AVAILABLE DATA")}
        </span>
        <button onClick={live.refresh} disabled={live.refreshing}>
          {tr(live.refreshing ? "Updating…" : "Refresh ↻")}
        </button>
      </div>
      <div className="weather-reading">
        <div>
          <span className="weather-value">
            {tr(
              o
                ? `${o.temperature.toFixed(1)}°`
                : live.observation.status === "loading"
                  ? "…"
                  : "—",
            )}
          </span>
          <span className="weather-caption">
            {tr(o?.outdated ? "Older station report" : "Station measurement")}
            <small>{tr("IMGW-PIB · Kraków · station 12566")}</small>
          </span>
        </div>
        {tr(
          o ? (
            <p className="weather-timestamp">
              {tr("Reported ")}
              {tr(o.reportedTime)}
              <br />
              <span>
                {tr("Provider timestamp; timezone not included. Retrieved")}
                {tr(" ")}
                {tr(formatTime(o.fetchedAt))}
                {tr(" Warsaw time.")}
              </span>
            </p>
          ) : (
            <p className="weather-timestamp" role="status">
              {tr(
                live.observation.status === "error"
                  ? live.observation.error
                  : "Requesting the latest station report…",
              )}
            </p>
          ),
        )}
      </div>
      {tr(
        !compact && (
          <>
            <div className="forecast-heading">
              <strong>{tr("The next seven days")}</strong>
              <span>{tr("Forecast · °C / rainfall in mm")}</span>
            </div>
            {tr(
              f ? (
                <div className="forecast-days">
                  {tr(
                    f.days.map((d, i) => (
                      <div key={d.time}>
                        <small>
                          {tr(
                            i === 0
                              ? "Today"
                              : new Date(d.time * 1000).toLocaleDateString(
                                  locale(),
                                  {
                                    weekday: "short",
                                    timeZone: "Europe/Warsaw",
                                  },
                                ),
                          )}
                        </small>
                        <span
                          className="forecast-range"
                          style={{
                            height: `${Math.max(12, Math.min(45, (d.max - d.min) * 2))}px`,
                          }}
                        />
                        <strong>
                          {tr(Math.round(d.max))}
                          {tr("°")}
                        </strong>
                        <span>
                          {tr(Math.round(d.min))}
                          {tr("°")}
                        </span>
                        <small>
                          {tr(d.rain.toFixed(1))}
                          {tr(" mm")}
                        </small>
                      </div>
                    )),
                  )}
                </div>
              ) : (
                <p className="weather-timestamp" role="status">
                  {tr(
                    live.forecast.status === "loading"
                      ? "Requesting the current forecast…"
                      : live.forecast.error,
                  )}
                </p>
              ),
            )}
            {tr(
              f && (
                <p className="forecast-note">
                  {tr(
                    Math.max(...f.days.map((d) => d.max)) >= 30
                      ? "The forecast includes a daily maximum of at least 30°C. This is weather context, not an official heat alert."
                      : "A longer-term heat project can be explored even when the current forecast is mild.",
                  )}
                  {tr(" ")}
                  {tr("Fetched ")}
                  {tr(formatTime(f.fetchedAt))}
                  {tr(" (Warsaw).")}
                </p>
              ),
            )}
          </>
        ),
      )}
      <div className="live-sources">
        <a href={STATION_URL} target="_blank" rel="noreferrer">
          {tr("IMGW observation ↗")}
        </a>
        {tr(
          !compact && (
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              {tr("Forecast by Open-Meteo · CC BY 4.0 ↗")}
            </a>
          ),
        )}
      </div>
      {tr(
        !compact && (
          <small className="weather-scope">
            {tr(
              "Station conditions are not a neighbourhood heat map. The forecast is modelled; official weather warnings are not connected. Refreshes every 15 minutes while open.",
            )}
          </small>
        ),
      )}
    </section>
  );
}
