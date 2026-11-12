// Weather forecast from Open-Meteo (owner: Mahmoud)
// External API: https://open-meteo.com  (free, no key needed)
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Open-Meteo sends a number (weather code). We turn it into words.
function describeWeather(code) {
  if (code === 0) return 'Sunny';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  return 'Thunderstorm';
}

// Returns the next 7 days: [{ date, tempMin, tempMax, rainChance, description, rainExpected }]
async function getForecast() {
  const latitude = process.env.GARDEN_LATITUDE || '30.0444';
  const longitude = process.env.GARDEN_LONGITUDE || '31.2357';
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}`
    + '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code'
    + '&timezone=auto&forecast_days=7';

  // Stop waiting after 5 seconds, so a slow weather service cannot hang our API
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`Open-Meteo answered ${response.status}`);
  }
  const data = await response.json();
  const daily = data.daily;

  const days = [];
  for (let i = 0; i < daily.time.length; i++) {
    const rainChance = daily.precipitation_probability_max[i] || 0;
    days.push({
      date: daily.time[i],
      tempMin: Math.round(daily.temperature_2m_min[i]),
      tempMax: Math.round(daily.temperature_2m_max[i]),
      rainChance: rainChance,
      description: describeWeather(daily.weather_code[i]),
      rainExpected: rainChance >= 50          // 50% or more: watering is optional
    });
  }
  return days;
}

module.exports = { getForecast };
