// My watering duties + 7-day forecast (owner: Mahmoud)
// GET   /api/duties
// PATCH /api/duties/:id/complete
// GET   /api/duties/forecast

async function loadDuties() {
  try {
    const duties = await apiRequest('/duties');
    const open = showDutyGroups(document.querySelector('#duties-groups'), duties, async (duty) => {
      try {
        await completeDuty(duty);
        loadDuties();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
    document.querySelector('#duties-open').textContent = `${open} open`;
  } catch (error) {
    document.querySelector('#duties-groups').replaceChildren(emptyMessage('Could not load your duties', error.message));
  }
}

async function loadForecast() {
  try {
    const days = await apiRequest('/duties/forecast');
    showForecastStrip(days);
  } catch (error) {
    document.querySelector('#weather-note').textContent = 'Forecast unavailable right now. Water as planned.';
  }
}

if (pageAllowed) {
  loadDuties();
  loadForecast();
}
