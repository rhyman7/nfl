// Kickoff forecast for this week's games, fetched in the viewer's browser from
// Open-Meteo (free, no key). Each game carries its stadium's coordinates in
// data.json. Everything is best-effort: if a lookup fails, the card just shows no
// forecast. Indoor stadiums are labeled on the card and skipped here.

const WX_API = "https://api.open-meteo.com/v1/forecast";
const WX_DAYS = 16;                         // Open-Meteo's forecast horizon

// WMO weather codes → icon + short label
function wxCode(c) {
  if (c === 0) return ["☀️", "Clear"];
  if (c === 1) return ["🌤", "Mostly clear"];
  if (c === 2) return ["⛅", "Partly cloudy"];
  if (c === 3) return ["☁️", "Cloudy"];
  if (c === 45 || c === 48) return ["🌫", "Fog"];
  if (c >= 51 && c <= 57) return ["🌦", "Drizzle"];
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return ["🌧", "Rain"];
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ["🌨", "Snow"];
  if (c >= 95) return ["⛈", "Thunderstorms"];
  return ["🌡", "Forecast"];
}

function startWeather(games, rerender) {
  const now = Date.now();
  const horizon = now + (WX_DAYS - 1) * 24 * 3600 * 1000;
  const todo = games.filter(g => !isFinal(g) && g.indoor !== true && g.lat != null && g.lon != null && g.gametime &&
    gameStart(g).getTime() > now - 6 * 3600 * 1000 && gameStart(g).getTime() < horizon);
  if (!todo.length) return;

  (async () => {
    // one entry per stadium; Open-Meteo takes several locations per request
    const places = [...new Map(todo.map(g => [`${g.lat},${g.lon}`, { lat: g.lat, lon: g.lon }])).entries()];
    const fc = {};
    for (let i = 0; i < places.length; i += 20) {
      const chunk = places.slice(i, i + 20);
      const params = new URLSearchParams({
        latitude: chunk.map(([, p]) => p.lat).join(","),
        longitude: chunk.map(([, p]) => p.lon).join(","),
        hourly: "temperature_2m,precipitation_probability,weather_code,wind_speed_10m",
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
        timezone: "GMT",
        forecast_days: String(WX_DAYS),
      });
      try {
        const res = await fetch(`${WX_API}?${params}`);
        if (!res.ok) continue;
        let body = await res.json();
        if (!Array.isArray(body)) body = [body];
        chunk.forEach(([key], k) => { if (body[k] && body[k].hourly) fc[key] = body[k]; });
      } catch (e) { /* leave this chunk without a forecast */ }
    }

    let changed = false;
    todo.forEach(g => {
      const f = fc[`${g.lat},${g.lon}`];
      if (!f) return;
      // Nearest hour to kickoff, in GMT to match the API's timestamps.
      const hr = new Date(Math.round(gameStart(g).getTime() / 3600000) * 3600000);
      const key = hr.toISOString().slice(0, 16);
      const i = (f.hourly.time || []).indexOf(key);
      if (i < 0 || f.hourly.temperature_2m[i] == null) return;
      const [icon, text] = wxCode(f.hourly.weather_code[i]);
      WX[g.id] = { icon, text, temp: Math.round(f.hourly.temperature_2m[i]),
        pop: f.hourly.precipitation_probability[i], wind: Math.round(f.hourly.wind_speed_10m[i]) };
      changed = true;
    });
    if (changed) rerender();
  })();
}
