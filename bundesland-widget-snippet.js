/**
 * Betterbusiness — Bundesland-Kacheln Widget
 * Deployment: host this file, then embed with:
 *   <div id="bb-bundesland-widget"></div>
 *   <script src="https://YOUR-DOMAIN/bundesland-widget-snippet.js" async></script>
 *
 * Target div ID can be customized via: <script src="..." data-target="my-id"></script>
 */
(function() {
  'use strict';

  // Funnel URLs — desktop vs mobile. The widget auto-picks based on viewport width.
  // To change the mobile funnel URL later, edit FUNNEL_MOBILE_BASE below.
  var FUNNEL_DESKTOP_BASE = 'https://www.top10-anbieter.de/solar-desktop3';
  var FUNNEL_MOBILE_BASE  = 'https://www.top10-anbieter.de/solar-mobile3';
  var FUNNEL_HASH = '#immobilie';
  var UTM = 'utm_source=ad20&utm_medium=advertorial&utm_campaign=bundesland-widget';
  var MOBILE_MQ = '(max-width: 600px)';

  function isMobile() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

  function buildUrl(abbr) {
    var base = isMobile() ? FUNNEL_MOBILE_BASE : FUNNEL_DESKTOP_BASE;
    return base + '?' + UTM + '&utm_content=' + abbr + FUNNEL_HASH;
  }

  var STATES = [
    { abbr: 'BW', name: 'Baden-Württemberg' },
    { abbr: 'BY', name: 'Bayern' },
    { abbr: 'BE', name: 'Berlin' },
    { abbr: 'BB', name: 'Brandenburg' },
    { abbr: 'HB', name: 'Bremen' },
    { abbr: 'HH', name: 'Hamburg' },
    { abbr: 'HE', name: 'Hessen' },
    { abbr: 'MV', name: 'Mecklenburg-Vorpommern' },
    { abbr: 'NI', name: 'Niedersachsen' },
    { abbr: 'NW', name: 'Nordrhein-Westfalen' },
    { abbr: 'RP', name: 'Rheinland-Pfalz' },
    { abbr: 'SL', name: 'Saarland' },
    { abbr: 'ST', name: 'Sachsen-Anhalt' },
    { abbr: 'SN', name: 'Sachsen' },
    { abbr: 'SH', name: 'Schleswig-Holstein' },
    { abbr: 'TH', name: 'Thüringen' }
  ];

  // Scoped CSS — prefixed with .bb-widget to avoid clashing with host page styles
  var CSS = [
    '.bb-widget,.bb-widget *{box-sizing:border-box;margin:0;padding:0;}',
    '.bb-widget{background:#ededed;padding:40px 24px;max-width:900px;margin:0 auto;font-family:"Lato",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;}',
    '.bb-widget__heading{font-size:22px;font-weight:700;color:#111;text-align:center;margin-bottom:32px;letter-spacing:-0.01em;}',
    '.bb-widget__grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}',
    '.bb-tile{display:flex;align-items:center;justify-content:center;background:#fff;border:2.5px solid #111;border-radius:10px;padding:22px 20px;min-height:78px;text-decoration:none;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,transform .1s ease;-webkit-tap-highlight-color:transparent;}',
    '.bb-tile:hover{background:#dcfce7;border-color:#16a34a;}',
    '.bb-tile:active{transform:scale(0.98);}',
    '.bb-tile:focus-visible{outline:3px solid #16a34a;outline-offset:2px;}',
    '.bb-tile__abbr{font-size:18px;font-weight:700;color:#22c55e;margin-right:14px;letter-spacing:.02em;min-width:32px;text-align:left;}',
    '.bb-tile__name{font-size:17px;font-weight:700;color:#111;letter-spacing:-0.005em;}',
    '@media (max-width:600px){',
      '.bb-widget{padding:28px 16px;}',
      '.bb-widget__heading{font-size:20px;margin-bottom:24px;}',
      '.bb-widget__grid{grid-template-columns:1fr;gap:14px;}',
      '.bb-tile{padding:20px 18px;min-height:72px;justify-content:flex-start;}',
      '.bb-tile__abbr{font-size:17px;margin-right:12px;}',
      '.bb-tile__name{font-size:16px;}',
    '}'
  ].join('');

  function injectFont() {
    if (document.getElementById('bb-widget-font')) return;
    var link = document.createElement('link');
    link.id = 'bb-widget-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap';
    document.head.appendChild(link);
  }

  function injectStyle() {
    if (document.getElementById('bb-widget-style')) return;
    var style = document.createElement('style');
    style.id = 'bb-widget-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildWidget() {
    var root = document.createElement('div');
    root.className = 'bb-widget';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Bundesland auswählen');

    var heading = document.createElement('h2');
    heading.className = 'bb-widget__heading';
    heading.textContent = 'In welchem Bundesland leben Sie?';
    root.appendChild(heading);

    var grid = document.createElement('div');
    grid.className = 'bb-widget__grid';

    STATES.forEach(function(s) {
      var a = document.createElement('a');
      a.className = 'bb-tile';
      a.setAttribute('data-abbr', s.abbr);
      a.href = buildUrl(s.abbr);
      a.target = '_top';
      a.rel = 'noopener';
      a.setAttribute('aria-label', s.name);

      var abbr = document.createElement('span');
      abbr.className = 'bb-tile__abbr';
      abbr.textContent = s.abbr;

      var name = document.createElement('span');
      name.className = 'bb-tile__name';
      name.textContent = s.name;

      a.appendChild(abbr);
      a.appendChild(name);
      grid.appendChild(a);
    });

    root.appendChild(grid);
    return root;
  }

  function mount() {
    // Resolve target: data-target attribute on script tag, else default ID
    var currentScript = document.currentScript;
    var targetId = 'bb-bundesland-widget';
    if (currentScript && currentScript.getAttribute('data-target')) {
      targetId = currentScript.getAttribute('data-target');
    }

    var target = document.getElementById(targetId);
    if (!target) {
      // Fallback: insert right after the script tag
      if (currentScript && currentScript.parentNode) {
        target = document.createElement('div');
        target.id = targetId;
        currentScript.parentNode.insertBefore(target, currentScript.nextSibling);
      } else {
        console.warn('[bb-bundesland-widget] No target div found (#' + targetId + ').');
        return;
      }
    }

    // Clear any existing content to prevent duplicate injection
    target.innerHTML = '';

    injectFont();
    injectStyle();
    target.appendChild(buildWidget());

    // Keep hrefs in sync with viewport (rotation, resize, so right-click "copy link" is correct)
    function refreshHrefs() {
      var tiles = target.querySelectorAll('.bb-tile');
      for (var i = 0; i < tiles.length; i++) {
        tiles[i].href = buildUrl(tiles[i].getAttribute('data-abbr'));
      }
    }

    var mql = window.matchMedia(MOBILE_MQ);
    if (mql.addEventListener) {
      mql.addEventListener('change', refreshHrefs);
    } else if (mql.addListener) {
      mql.addListener(refreshHrefs); // Safari < 14 fallback
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
