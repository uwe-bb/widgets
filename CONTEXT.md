# Welt Advertorials — Widget & Campaign Context

> **Status as of 2026-07-22**
> - Widget code: ✅ done & merged to `main`, live on `uwe-bb.github.io/widgets/`. Both widgets on the branded `vergleich` funnel domains with full tracking, correct hashes, mobile height broadcast, and fixed device detection (commit `25410eb`).
> - Article CTA links: ✅ live on both pages.
> - Mobile iframe resize fix: ✅ implemented by Welt IT (`wp_widget_resize` listener live on both pages).
> - Param passthrough (gclid/wbraid/gbraid + UTMs): ✅ **LIVE** — Welt deployed a forwarding script on both articles (article links ~2026-06-11, widget iframes 2026-07-02). Verified end-to-end 2026-07-03, re-verified 2026-07-22.
> - Offline conversion uploads: ✅ configured on account `382-370-6884` (4 Import-click actions, created 2026-07-08/09); imports flowing since 2026-07-21. Bidding switched from manual CPC to **Maximize conversions** (custom goal `Partner submit / with value`).
> - Campaigns: ✅ **live again** — re-enabled 2026-07-14/21 after a paused diagnosis phase; HP budget €500/day.
> - Widgets are stable; no active development. This doc + the README are the handoff.

---

## Overview

Two advertorial pages on Welt.de embed our Bundesland (German-state) selector widgets. A user picks their state and is routed to the matching funnel with tracking attached. Google Ads campaigns point at these articles.

**Pages:**
- https://unternehmen.welt.de/haus-garten/waermepumpe.html
- https://unternehmen.welt.de/haus-garten/photovoltaik.html

**Widget files (self-hosted, GitHub Pages at `uwe-bb.github.io/widgets/`):**
- `bundesland-widget-heat-pump.html` — heat pump tile selector
- `bundesland-widget-iframe.html` — solar/PV tile selector
- `README.md` — practical reference (files, funnel destinations, full parameter breakdown)

Welt embeds these HTML files directly via a raw `<iframe>` tag.

---

## Google Ads setup

- **Account:** `Lead gen - Welt DE DACH (382-370-6884)` — one account, two campaigns:
  - Heat Pump (owner: Uwe) — Google Ads campaign name `Heat Pump DACH 3 - Welt | Search`
  - Solar (owner: Antoine) — `Solar DACH 3 - Welt | Search`
  - (Named after the exact Zapier campaign so the DWH joins without hardcoding — Alex's convention.)
- **Bid strategy:** Maximize conversions with custom goal `Partner submit / with value` (switched from manual CPC 2026-07-14/16 once conversion imports became possible).
- **Attribution:** Tableau revenue via the **bcid** system (see below) + Google-side conversions via **gclid offline conversion imports** since 2026-07-21. Four Import-click conversion actions exist on the account (created 2026-07-08/09): `Lead / unqualified`, `Lead / qualified`, `Partner submit / without value`, `Partner submit / with value` (only the last one is the primary/bidding goal).
  - ⚠️ Leads with `Type = Erdwärmepumpe` are **excluded from Google conversion tracking by business rule** — expect campaign conversion counts to sit below Tableau lead counts.
- **Funnels reused:** Heat Pump 2 / Solar 2 Heyflow funnels, with a bcid override giving each its own campaign in Tableau. The funnels capture `gclid`/`wbraid`/`gbraid` as hidden fields.
- **Tracking template (Google Ads side):**
  ```
  {lpurl}?matchtype={matchtype}&gclid={gclid}&utm_source=GoogleAds&utm_campaign={campaignid}&keyword={keyword}&placement={placement}&device={device}
  ```
  `bcid` is intentionally excluded from the tracking template — it lives at the destination-link level, not the landing-page level.

---

## Architecture

Each page has two paths to the funnel — both now on the branded `vergleich` domains.

### 1. Article CTA links (in the article body, managed by Welt)
A single desktop funnel URL per vertical (one link, no device fork). No dedicated landing pages.

| Page | Destination |
|------|-------------|
| Wärmepumpe | `https://vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-desktop-2` (+ `#building-type`) |
| Photovoltaik | `https://vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-desktop3` (+ `#immobilie`) |

✅ Welt implemented these (with full tracking params, below) — confirmed live on both pages.

### 2. Iframe tile clicks (inside the widget, managed by us)
Same branded `vergleich` funnels, with desktop/mobile chosen by the widget.

| Widget | Desktop funnel | Mobile funnel |
|--------|---------------|---------------|
| Heat pump | `vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-desktop-2` | `vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-mobile-2` |
| Solar | `vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-desktop3` | `vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-mobile3` |

The widget detects mobile vs. desktop; heat pump appends `#building-type`, solar `#immobilie` (these are the first-screen names in Heyflow).

---

## Tracking Parameters

### On every tile / article link
| Parameter | Heat pump | Solar |
|-----------|-----------|-------|
| `utm_source` | `welt.de` | `welt.de` |
| `utm_medium` | `advertorial` | `advertorial` |
| `utm_campaign` | `hp_june26` | `solar_june26` |
| `bcid` | `3jf95jdleq` | `usjr74ngzs` |
| `publisher` | `Welt` | `Welt` |
| `publisher-content` | `welt-heat-pump-article` | `welt-solar-article` |
| `utm_content` | State code (e.g. `BY`) | State code (e.g. `BY`) |
| `bundesland` | State code | — (solar uses `#immobilie` instead) |

- `utm_source` / `utm_medium` / `utm_campaign` — required for Tableau reporting.
- `bcid` — overrides the Heyflow funnel's default campaign so leads/revenue attribute to the right campaign in Tableau. **If the browser strips it, the lead falls back to the funnel default.**
- `publisher` / `publisher-content` — stored in Zapier, used for Tableau evaluations. From Niklas's bcid-system spec (Slack, 29 Apr 2026).

### bcid values — verified against the [Campaigns table](https://tables.zapier.com/app/tables/t/01HFQD08J2PFD93ZMZEYQRAS8F) (2026-06-09)
| Campaign (table field `f6`) | bcid (`f24`) |
|------|------|
| Heat Pump DACH 3 | `3jf95jdleq` |
| Solar DACH 3 | `usjr74ngzs` |

### Month tag — FROZEN
`utm_campaign` carries a month (`june26`). **It is intentionally frozen** — Welt charges for changes after an advertorial goes live (waived this once as goodwill). So `hp_june26` / `solar_june26` will stay as-is until we make other changes we can bundle it with. Do **not** expect it to track the current month.

### Ad-click passthrough — LIVE
Both widgets forward `gclid`, `wbraid`, `gbraid`, `msclkid`, `matchtype`, `keyword`, `placement`, `device` from the widget's own src URL (and `document.referrer` as a fallback) to the tile links (`wbraid`/`gbraid` added in commit `25410eb`). `utm_source` / `utm_campaign` are deliberately NOT passed through — they stay hardcoded to `welt.de` / the month tag so traffic always attributes to Welt.

This works because Welt deployed a forwarding script on both articles (see next section): the article URL's params land on the iframe `src`, the widget picks them up and appends them to every tile link. Note that with parallel tracking, only auto-tagging params (`gclid`/`wbraid`/`gbraid`) actually arrive on the article URL from real ad clicks — the tracking-template params (`matchtype`, `keyword`, …) never reach the landing page and therefore never reach the funnel.

---

## Mobile UX Fix

**Problem:** Welt's iframe had `min-height:1080px`. On mobile the 16 single-column tiles exceed that, causing an internal scrollbar — Thüringen (last tile) gets cut off.

**Rejected approach:** a `<select>` dropdown on mobile (built, then reverted — Uwe preferred keeping the tiles).

**Chosen fix:** the widget broadcasts its real height via `postMessage` (`wp_widget_resize`); Welt adds a listener that resizes the iframe and drops the `min-height`. Snippet sent to Welt:
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
Plus change `min-height:1080px` → `height:600px` on the `<iframe>` tag.

> ✅ **Status:** implemented by Welt IT — listener live on both pages, iframe on `min-height:600px`.

---

## gclid Passthrough — LIVE (history)

**Goal:** carry the `gclid` from the Welt article URL → funnel → Heyflow for conversion attribution.

**Original blocker:** the iframe is cross-origin (`uwe-bb.github.io` vs `unternehmen.welt.de`), so it can't read the parent URL, and `document.referrer` doesn't carry query params (Welt's `strict-origin-when-cross-origin` policy). Welt IT initially **declined** a forwarding script — which is why the account launched on manual CPC with bcid-only attribution.

**Welt then reversed course** and deployed a forwarding script on both articles, in two rounds:
1. **~2026-06-11 (v1):** rewrote article `<a>` links only, using `searchParams.set()` — gclid reached the funnel via CTA links, but not via the widget, and the hardcoded `utm_source=welt.de` got overwritten by incoming params.
2. **2026-07-02 (v2, current):** targets `main.adcs-main a, main.adcs-main iframe`, forwards `utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, wbraid, gbraid`, and uses `append()` with a `has()` guard so existing (hardcoded) params are never overwritten.

Verified end-to-end 2026-07-03 (both pages, browser click-test + code review), re-verified 2026-07-22. This is what unlocked offline conversion uploads and the switch away from manual CPC.

---

## Key decisions (log)

- **Funnel domains:** switched from generic `top10-anbieter.de` to branded `vergleich.top10-*-angebotsvergleich.de` (both widgets + article links), for consistency / advertiser-domain use. Antoine approved the solar switch.
- **Month tag frozen** (see above) — Welt charges for post-go-live edits.
- **GitHub org move:** considered moving the repo off Uwe's personal account to the org. **Decided against** for now (it's a test; would need a coordinated Pages-URL cutover + Welt re-embedding the iframe). Custom-domain route also rejected as overkill.
- **Labels anglicized:** `publisher-content` uses English (`welt-heat-pump-article`), `utm_campaign` uses `hp_`/`solar_`.
- **Dead code removed:** `bundesland-widget-snippet.js` (inline solar) and `bundesland-widget-snippet-heat-pump.js` (loader) — both unused; Welt embeds the iframe HTML directly.
- **Device detection rewritten (2026-07-02, commit `25410eb`):** a previous fix keyed `isMobile()` on `(max-width: 767px)`, but inside Welt's iframe that measures the **article column** (< 768px even on desktop) — every desktop visitor got the mobile funnel. Now detects via `pointer: coarse` + UA + `maxTouchPoints` only; `test/device-detection.test.mjs` rejects any width media query in `isMobile()`.

---

## Still open / to verify

| Item | Owner | Status |
|------|-------|--------|
| Mobile iframe resize listener | Welt IT | ✅ Implemented |
| Cost data correct in Tableau | Alex / DWH | ✅ Resolved (2026-06, after campaign rename) |
| Funnels preserve query params through to Heyflow | Internal test | ✅ Confirmed (gclid/wbraid/gbraid captured; verified on 10k responses) |
| Heyflow hidden fields for `gclid`/`wbraid`/`gbraid` | Internal | ✅ Confirmed present in HP2/Solar2 funnels |
| Conversion uploads working end-to-end (no double-count / misattribution) | Christopher (Ops) | ✅ Verified 2026-07-22/23: Ads value matched Lead-submitted table to the cent (€1,265.95, click-day 07-21); Heyflow→Zapier 1:1 for both campaigns (HP 18↔18, Solar 11↔11). Known Ads-vs-export gaps by design: no-click-ID leads + `Ads Optimization=false` leads (business-value criteria, not consent). Ads Diagnostics view lags/omits the two newer actions — cosmetic. |
| HP DACH 4 Lovable LP dropping URL params (separate account, not Welt) | Julian | ⏳ Open |
| iOS tap-does-nothing on article CTA links: Welt's `bottom.js` intercepts clicks on `.adcs-main a` (`preventDefault` + `window.open`); when iOS popup heuristics block `window.open`, nothing happens (long-press bypasses page JS and works). Fix requested: remove interception or fall back to `location.href` when `window.open` returns null. Widget tiles unaffected (inside iframe). | Welt IT (ticket via Klosik) | ⏳ Ticket created 2026-07-23; `bottom.js` unchanged as of same day — re-verify when IT reports back |
| Article CTA links switched to mobile funnel URLs (`waermepumpe-mobile-2` / `solar-mobile3`), with `utm_content=intro/mid/outro` per position; params/bcids unchanged. | Klosik | ✅ Live + verified 2026-07-23 (6 links per page, widget untouched) |

---

## Contacts

**Welt (external):**
- **Julian Klosik** — editorial contact; updates article links, routes technical asks to IT. (Note: post-go-live changes are normally chargeable.)
- **Jens** — Welt IT; handles code-level changes (iframe, scripts).

**Internal:**
- **Julian Weber** — set up the funnel links / widget structure; asked for the account status update.
- **Antoine** — owns the Solar campaign; co-decided the funnel-domain / link architecture.
- **Niklas** — defined the tracking-parameter / bcid system (`bcid`, `publisher`, `publisher-content`).
- **Christopher + Luka** — own conversion tracking / uploads since Camila's handover (2026-07-17). **Camila** — previously Campaigns table / bcid entries / conversion actions. **Alex** — DWH pipeline + campaign naming convention.
