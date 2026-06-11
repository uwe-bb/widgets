# Welt Advertorials — Widget & Campaign Context

> **Status as of 2026-06-11**
> - Widget code: ✅ done & merged to `main`, live on `uwe-bb.github.io/widgets/`. Both widgets on the branded `vergleich` funnel domains with full tracking (bcid, UTMs, publisher params), correct hashes, and mobile height broadcast.
> - Article CTA links: ✅ Welt updated them (Julian Klosik, confirmed live on both pages, no charge this time).
> - Mobile iframe resize fix: ⏳ Welt IT ticket created, pending implementation.
> - gclid passthrough: ❌ Welt declined — running manual CPC, attribution via bcid (no offline conversion uploads).
> - Campaigns: ✅ **launched 2026-06-10** (account `382-370-6884`, manual CPC) — first leads already flowing. Cost data in Tableau not yet correct (Alex / DWH pipeline on it).
> - **Work paused here** — widgets are final and stable; no active development. This doc + the README are the handoff.

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
  - Heat Pump (owner: Uwe) — Google Ads campaign name `Heat Pump DACH - Welt | Search`
  - Solar (owner: Antoine) — `Solar DACH - Welt | Search`
- **Bid strategy:** manual CPC (tCPA null by design).
- **Attribution:** via the **bcid** system (see below), NOT gclid — Welt won't pass the gclid through, so no offline conversion uploads on this account. Google-side conversion KPIs (Partner Submit, ROAS, CPA) won't populate.
- **Funnels reused:** Heat Pump 2 / Solar 2 Heyflow funnels, with a bcid override giving each its own campaign in Tableau.
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

### Ad-click passthrough (built, but dormant)
Both widgets try to forward `gclid`, `msclkid`, `matchtype`, `keyword`, `placement`, `device` from the widget's own src URL (and `document.referrer` as a fallback) to the tile links. `utm_source` / `utm_campaign` are deliberately NOT passed through — they stay hardcoded to `welt.de` / the month tag so traffic always attributes to Welt. **Dormant** because Welt's referrer policy strips params and Welt IT declined the forwarding script (see below).

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

> ⏳ **Status:** Welt IT ticket created (2026-06). Pending implementation.

---

## gclid Passthrough — declined (background)

**Goal:** carry the `gclid` from the Welt article URL → funnel → Heyflow for conversion attribution.

**Blocker:** the iframe is cross-origin (`uwe-bb.github.io` vs `unternehmen.welt.de`), so it can't read the parent URL. `document.referrer` was tested and confirmed not to carry query params (Welt's `strict-origin-when-cross-origin` policy strips them).

**Asked Welt IT** for a small script forwarding the article's URL params into the iframe `src`. ❌ **Declined.** Consequence: no gclid-based offline conversion uploads — attribution relies on the bcid system + manual CPC instead.

---

## Key decisions (log)

- **Funnel domains:** switched from generic `top10-anbieter.de` to branded `vergleich.top10-*-angebotsvergleich.de` (both widgets + article links), for consistency / advertiser-domain use. Antoine approved the solar switch.
- **Month tag frozen** (see above) — Welt charges for post-go-live edits.
- **GitHub org move:** considered moving the repo off Uwe's personal account to the org. **Decided against** for now (it's a test; would need a coordinated Pages-URL cutover + Welt re-embedding the iframe). Custom-domain route also rejected as overkill.
- **Labels anglicized:** `publisher-content` uses English (`welt-heat-pump-article`), `utm_campaign` uses `hp_`/`solar_`.
- **Dead code removed:** `bundesland-widget-snippet.js` (inline solar) and `bundesland-widget-snippet-heat-pump.js` (loader) — both unused; Welt embeds the iframe HTML directly.

---

## Still open / to verify

| Item | Owner | Status |
|------|-------|--------|
| Mobile iframe resize listener | Welt IT | Ticket created, pending |
| Cost data correct in Tableau | Alex / DWH | In progress |
| Confirm `vergleich.top10-*-angebotsvergleich.de` funnels preserve query params through to Heyflow | Internal test | Open |
| Confirm Heyflow has `gclid` mapped as a hidden field | Internal | Open (moot unless passthrough ever revived) |
| Verify Welt's live article links match the spec'd params | Uwe (optional) | Optional sanity check |

---

## Contacts

**Welt (external):**
- **Julian Klosik** — editorial contact; updates article links, routes technical asks to IT. (Note: post-go-live changes are normally chargeable.)
- **Jens** — Welt IT; handles code-level changes (iframe, scripts).

**Internal:**
- **Julian Weber** — set up the funnel links / widget structure; asked for the account status update.
- **Antoine** — owns the Solar campaign; co-decided the funnel-domain / link architecture.
- **Niklas** — defined the tracking-parameter / bcid system (`bcid`, `publisher`, `publisher-content`).
- **Camila** — Campaigns table / bcid entries. **Alex** — DWH pipeline + campaign naming convention.
