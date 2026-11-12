/* ==========================================================================
   resident/duties.js  -  My watering duties + 7-day forecast (owner: Mahmoud)
   Functions:
     GET   /api/duties                 own duties (resident)
     PATCH /api/duties/:id/complete    only the assignee or an admin
     GET   /api/duties/forecast        next 7 days from Open-Meteo (via our backend)
   ========================================================================== */
(function () {
  'use strict';

  var ui = window.ui;
  var $ = ui.$, el = ui.el;
  var duties = [];

  function renderDuties() {
    var open = window.dutiesList.render($('duties-groups'), duties, function (duty, button) {
      window.dutiesList.complete(duty, button).then(renderDuties);
    }, { doneLimit: 5 });
    $('duties-open').textContent = open + ' open';
  }

  window.api.get('/duties')
    .then(function (data) { duties = data; renderDuties(); })
    .catch(function (err) {
      ui.clear($('duties-groups'));
      $('duties-groups').appendChild(ui.empty('Could not load your duties', err.message));
    });

  window.api.get('/duties/forecast')
    .then(window.dutiesList.renderForecast)
    .catch(function () { $('weather-note').textContent = 'Forecast unavailable right now. Water as planned.'; });
})();
