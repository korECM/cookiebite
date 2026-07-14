// cookiebite-tsx controls — theme/density toggles for [data-cb-toggle].
// Inlined as cookiebite-tsx-js when collected.flags includes 'controls'.
(function bootControls() {
  if (!window.CB) {
    window.addEventListener('cookiebite:core-ready', bootControls, { once: true });
    return;
  }

  // comfortable 기본(무속성)에서 첫 클릭이 compact가 되도록 순서 고정.
  var DENSITIES = ['comfortable', 'compact', 'spacious'];

  var THEME_KEY = 'cookiebite:theme';
  var DENSITY_KEY = 'cookiebite:density';

  function syncThemeButton() {
    var btn = document.querySelector('[data-cb-toggle="theme"]');
    if (!btn) return;
    var dark = window.CB.theme.mode() === 'dark';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  function syncDensityButton() {
    var btn = document.querySelector('[data-cb-toggle="density"]');
    if (!btn) return;
    var cur = document.documentElement.dataset.density || 'comfortable';
    var label = btn.querySelector('[data-cb-density-label]');
    if (label) label.textContent = cur;
    else {
      var icon = btn.querySelector('[aria-hidden="true"]');
      btn.textContent = '';
      if (icon) btn.appendChild(icon);
      btn.appendChild(document.createTextNode(' ' + cur));
    }
  }

  try {
    var savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      window.CB.theme.set(savedTheme);
    }
  } catch (e) {}

  try {
    var savedDensity = localStorage.getItem(DENSITY_KEY);
    if (DENSITIES.indexOf(savedDensity) !== -1) {
      document.documentElement.dataset.density = savedDensity;
    }
  } catch (e) {}

  syncThemeButton();
  syncDensityButton();

  document.addEventListener('click', function (event) {
    var btn = event.target && event.target.closest ? event.target.closest('[data-cb-toggle]') : null;
    if (!btn) return;
    var kind = btn.getAttribute('data-cb-toggle');
    if (kind === 'theme') {
      var next = window.CB.theme.mode() === 'dark' ? 'light' : 'dark';
      window.CB.theme.set(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {}
      syncThemeButton();
    } else if (kind === 'density') {
      var cur = document.documentElement.dataset.density || 'comfortable';
      var idx = DENSITIES.indexOf(cur);
      var nextDensity = DENSITIES[(idx === -1 ? 0 : idx + 1) % DENSITIES.length];
      document.documentElement.dataset.density = nextDensity;
      try {
        localStorage.setItem(DENSITY_KEY, nextDensity);
      } catch (err) {}
      syncDensityButton();
    }
  });
})();
