# Welt Advertorials — Widget & Campaign Context

## Overview

Two advertorial pages on Welt.de embed our Bundesland selector widgets. Users pick their German state and are routed to a funnel. We are planning to run Google Ads campaigns linking to these articles.

**Pages:**
- https://unternehmen.welt.de/haus-garten/waermepumpe.html
- https://unternehmen.welt.de/haus-garten/photovoltaik.html

**Widget files (self-hosted on uwe-bb.github.io):**
- `bundesland-widget-heat-pump.html` — heat pump tile selector
- `bundesland-widget-iframe.html` — solar/PV tile selector

---

## Architecture

Each page has two ways for users to reach our funnel:

### 1. Article CTA links (outside the iframe, managed by Welt)
These go to **Unbounce landing pages** (account 1), which handle mobile/desktop forking internally.

| Page | Intended destination |
|------|----------------------|
| Wärmepumpe | `https://www.top10-waermepumpen-angebotsvergleich.de/desktop/main/` |
| Photovoltaik | `https://www.top10-photovoltaikanlage-angebotsvergleich.de/main/desktop/` |

> ⚠️ **Status:** These Unbounce pages do not exist yet and need to be created. Welt currently links to the root URL with their own hardcoded UTMs. The link update cannot be requested from Welt until the Unbounce pages are live.

### 2. Iframe tile clicks (inside the widget, managed by us)
These go directly to **account 2 funnels** (top10-anbieter.de), which have their own mobile/desktop logic.

| Widget | Desktop funnel | Mobile funnel |
|--------|---------------|---------------|
| Heat pump | `top10-anbieter.de/waermepumpe-desktop-2` | `top10-anbieter.de/waermepumpe-mobile-2` |
| Solar | `top10-anbieter.de/solar-desktop3` | `top10-anbieter.de/solar-mobile3` |

Account 2 funnels are used here because there is no account 1 equivalent with the same mobile/desktop split capability at the tile level.

---

## Tracking Parameters

### Hard-coded on every tile click
| Parameter | Heat pump | Solar |
|-----------|-----------|-------|
| `utm_source` | `welt.de` | `welt.de` |
| `utm_medium` | `advertorial` | `advertorial` |
| `utm_campaign` | `hp_june26` | `solar_june26` |
| `bcid` | `3jf95jdleq` | `usjr74ngzs` |
| `publisher` | `Welt` | `Welt` |
| `publisher-content` | `welt-heat-pump-article` | `welt-solar-article` |
| `utm_content` | State code (e.g. `BY`) | State code (e.g. `BY`) |
| `bundesland` | State code | — |

`utm_source` / `utm_medium` / `utm_campaign` are required for Tableau reporting. `bcid` identifies the Google Ads account/campaign in Heyflow and routes to the correct configuration. `publisher` and `publisher-content` are stored in Zapier and used for Tableau reporting. The `utm_campaign` month tag (`june26`) is updated per campaign launch month.

### Google Ads tracking template
```
{lpurl}?matchtype={matchtype}&gclid={gclid}&utm_source=GoogleAds&utm_campaign={campaignid}&keyword={keyword}&placement={placement}&device={device}
```

`bcid` is intentionally excluded from the tracking template — it lives at the destination link level, not the landing page level.

### Passthrough params (gclid etc.)
The widgets are built to forward `gclid`, `msclkid`, `matchtype`, `keyword`, `placement`, and `device` from their own src URL to every tile link. (`utm_source` / `utm_campaign` are intentionally NOT passed through — they're hardcoded to `welt.de` / `hp_june26` so advertorial traffic always attributes to Welt, not to Google's own values.) Two fallback mechanisms are implemented:
1. **Widget src URL params** — works if the publisher adds a forwarding script (see below)
2. **`document.referrer` parsing** — attempted automatically, but confirmed not working due to Welt's strict referrer policy (`strict-origin-when-cross-origin`)

---

## Mobile UX Fix

**Problem:** The iframe had `min-height: 1080px` set by Welt. On mobile, 16 tiles in single-column layout exceed this height, causing an internal scrollbar. Thüringen (last state) was not visible.

**What we tried first:** Replace the tile grid with a `<select>` dropdown on mobile (≤640px). Technically worked but was reverted at Uwe's request in favour of keeping the tile UI.

**Correct fix:** The widget already broadcasts its actual height via `postMessage` (`wp_widget_resize`). The publisher needs to listen and resize the iframe accordingly. Both widgets (heat pump and solar PV) now send the same message type.

**Code for publisher (add once per page, before `</body>`):**
```html
<script>
(function(){
  window.addEventListener('message', function(ev) {
    var d = ev && ev.data;
    if (!d || d.type !== 'wp_widget_resize' || typeof d.height !== 'number') return;
    var iframes = document.querySelectorAll('iframe[src*="bundesland-widget"]');
    for (var i = 0; i < iframes.length; i++) {
      iframes[i].style.height = d.height + 'px';
      iframes[i].style.minHeight = '0';
    }
  });
})();
</script>
```
Also change `min-height:1080px` → `height:600px` on the iframe tag itself.

> ⚠️ **Status:** Requested from Welt IT. Response pending.

---

## Google Ads Attribution — gclid Passthrough

**The challenge:** Google Ads links to the Welt article. The `gclid` lands in the Welt article URL. For conversion attribution to work, the `gclid` needs to travel from the Welt URL → iframe widget → funnel → Heyflow.

**The problem:** The iframe runs on a different domain (`uwe-bb.github.io`) from the Welt article (`unternehmen.welt.de`). The browser's same-origin policy prevents the iframe from reading the parent page URL. `document.referrer` was tested and confirmed not to carry query params due to Welt's referrer policy.

**What we asked Welt IT for:**
A small script on both article pages that reads the article URL params and appends them to the iframe src:
```html
<script>
(function(){
  var src = window.location.search;
  if (!src) return;
  var el = document.querySelector('iframe[src*="bundesland-widget"]');
  if (!el) return;
  el.src += (el.src.indexOf('?') === -1 ? '?' : '&') + src.slice(1);
})();
</script>
```

**Example provided to Welt IT:**

Incoming (Google Ad → Welt article):
```
https://unternehmen.welt.de/haus-garten/waermepumpe.html?matchtype=e&gclid=Cj0KCAjw_pKiBhBBEiwAFUIBsXYZ123&utm_source=GoogleAds&utm_campaign=12345678&keyword=waermepumpe&device=mobile
```

Expected outgoing (user clicks CTA):
```
https://www.top10-waermepumpen-angebotsvergleich.de/?matchtype=e&gclid=Cj0KCAjw_pKiBhBBEiwAFUIBsXYZ123&utm_source=GoogleAds&utm_campaign=12345678&keyword=waermepumpe&device=mobile
```

> ❌ **Status:** Welt IT declined to implement. Campaign launching without gclid passthrough through the iframe tiles. Attribution for tile clicks will be incomplete. Article CTA links depend on Unbounce pages being created first.

---

## What Is Still Pending

| Item | Owner | Blocked on |
|------|-------|-----------|
| Create new Unbounce landing pages (`/desktop/main/`) | Us | — |
| Ask Welt to update article CTA links to new Unbounce URLs | Uwe → Welt/Julian | Unbounce pages must exist first |
| Ask Welt to update article CTA links with `bcid` + `publisher` params | Uwe → Welt/Julian | Same as above |
| iframe auto-resize listener | Welt IT | Awaiting response |
| gclid passthrough for iframe tiles | Welt IT | Declined — no solution currently |
| gclid passthrough for article CTA links | Welt IT | Declined — no solution currently |
| Confirm `top10-anbieter.de` preserves query params through redirect to Heyflow | Internal test | — |
| Confirm Heyflow has `gclid` mapped as a hidden field | Heyflow setup check | — |

---

## Welt Contacts

- **Julian Klosik** — editorial contact at Welt, passes requests to IT
- **Jens** — Welt IT, handles technical implementation requests

## Internal Contacts

- **Julian Weber** — internal, set up the funnel links and widget structure
- **Antoine** — co-decided on link architecture (Unbounce for article CTAs, account 2 for tiles)
- **Niklas** — defined the tracking parameter structure (`bcid`, `publisher`, `publisher-content`)
