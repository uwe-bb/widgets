/*!
 * Wärmepumpen-Angebotsvergleich — Bundesland widget loader
 * ------------------------------------------------------
 * Drop this file on a CDN alongside bundesland-widget-heat-pump.html. The advertorial
 * just needs the one <script src="…loader.js" data-funnel="…"> tag from
 * snippet-js.html; this file handles the rest:
 *
 *   1. Inserts a <div> placeholder at the exact script position.
 *   2. Creates an iframe pointing at the widget page (same origin as loader).
 *   3. Forwards the data-funnel attribute to the widget as ?funnel=… so the
 *      tiles all link to that specific campaign URL.
 *   4. Auto-resizes the iframe to the widget's reported scrollHeight.
 *
 * No external dependencies. ~2 kB un-minified.
 */
(function () {
  'use strict';

  // Find the currently-executing script tag. `document.currentScript`
  // isn't available when the script loads async, so fall back to the
  // last <script> on the page as a heuristic.
  var self =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName('script');
      return all[all.length - 1];
    })();
  if (!self) return;

  // Derive the widget URL from this loader's own URL. Expected layout:
  //   .../embed/bundesland-widget-snippet-heat-pump.js
  //   .../embed/bundesland-widget-heat-pump.html
  var widgetUrl;
  try {
    widgetUrl = new URL('bundesland-widget-heat-pump.html', self.src).href;
  } catch (e) {
    // Absolute fallback if URL() isn't available.
    widgetUrl = self.src.replace(/[^/]+$/, '') + 'bundesland-widget-heat-pump.html';
  }

  // Append the host-supplied funnel URLs as query params so the widget
  // uses the correct UTM-tagged targets. Supports separate desktop/mobile
  // overrides or a single `data-funnel` that applies to both.
  var funnelGeneric = self.getAttribute('data-funnel');
  var funnelDesktop = self.getAttribute('data-funnel-desktop');
  var funnelMobile  = self.getAttribute('data-funnel-mobile');
  var extras = [];
  if (funnelGeneric) extras.push('funnel=' + encodeURIComponent(funnelGeneric));
  if (funnelDesktop) extras.push('funnelDesktop=' + encodeURIComponent(funnelDesktop));
  if (funnelMobile)  extras.push('funnelMobile='  + encodeURIComponent(funnelMobile));
  if (extras.length) {
    var sep = widgetUrl.indexOf('?') === -1 ? '?' : '&';
    widgetUrl += sep + extras.join('&');
  }

  // Create the iframe.
  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.title = 'Wärmepumpen-Angebotsvergleich — Bundesland wählen';
  iframe.loading = 'lazy';
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute(
    'sandbox',
    'allow-scripts allow-popups allow-popups-to-escape-sandbox'
  );
  iframe.style.cssText = [
    'display:block',
    'width:100%',
    'max-width:1000px',
    'margin:0 auto',
    'border:0',
    'background:#EAEAEB',
    'min-height:1080px'
  ].join(';');

  // Insert right before the script tag.
  self.parentNode.insertBefore(iframe, self);

  // Listen for height updates and forwarded analytics events.
  window.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (!d || typeof d !== 'object') return;

    if (d.type === 'wp_widget_resize' && typeof d.height === 'number') {
      iframe.style.height = d.height + 'px';
      return;
    }

    if (d.type === 'wp_widget' && d.payload) {
      // Forward to host GTM/dataLayer if present.
      if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        try { window.dataLayer.push(d.payload); } catch (_) {}
      }
    }
  });
})();
