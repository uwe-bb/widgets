# Welt Bundesland Widgets

Self-hosted German-state ("Bundesland") selector widgets embedded in the Welt.de
advertorials for **Heat Pump**, **Solar / Photovoltaik**, and **Stairlift / Treppenlift**.
A user picks their state and is routed to the corresponding funnel with full
tracking attached.

Hosted via GitHub Pages at `https://uwe-bb.github.io/widgets/`.

> **Status (2026-07-22):** Live. Campaigns running (re-enabled 2026-07-14/21), param passthrough from the Welt articles is **live** (gclid/wbraid/gbraid reach the funnels), and offline conversion uploads are flowing into account `382-370-6884` since 2026-07-21. Widget code is **final and not under active development**. For the full project history — Google Ads setup, tracking-parameter rationale, decisions, Welt contacts, and open items — see **[`CONTEXT.md`](CONTEXT.md)**. Read that first if you're picking this up cold.

## Deployment

Push to `main` → live automatically via GitHub Pages (no build step). The widget logic — including the funnel destinations on the tiles — is fully under our control in these HTML files; Welt simply embeds them via a raw `<iframe>`.

## Tests

Device detection (mobile vs. desktop funnel routing) is covered by a regression test that extracts the real `isMobile()` from both widget HTML files and runs it against the cross-origin / capped-iframe scenarios:

```
node test/device-detection.test.mjs
```

The test also fails if `window.top` is ever read inside `isMobile()` again — that read throws a `SecurityError` in welt.de's cross-origin iframe, which was the original bug (mobile users routed to the desktop funnel). No dependencies; plain Node.

**Two things live on Welt's pages and require Welt to change (not us):**
1. The `<iframe>` embed itself — its `src` (`uwe-bb.github.io/widgets/…`) and sizing. ⚠️ If we ever rename files, move the repo, or change the GitHub account/Pages URL, Welt must re-point the `src` or the embeds break.
2. The article CTA links in the body (the non-iframe links). These were updated by Welt editorial; note Welt charges for post-go-live changes.

## Files

| File | Purpose |
|------|---------|
| `bundesland-widget-heat-pump.html` | Heat pump tile selector (iframe) |
| `bundesland-widget-iframe.html` | Solar / PV tile selector (iframe) |
| `bundesland-widget-stairlift.html` | Stairlift / Treppenlift tile selector (iframe) |
| `CONTEXT.md` | Full project background, architecture, and open items |

The Welt advertorials embed these HTML files directly via a raw `<iframe>` tag.

## Funnel destinations (iframe tile clicks)

| Widget | Desktop | Mobile |
|--------|---------|--------|
| Heat pump | `vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-desktop-2` | `vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-mobile-2` |
| Solar | `vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-desktop3` | `vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-mobile3` |
| Stairlift | `www.top10-anbieter.de/treppenlift-2` | `www.top10-anbieter.de/treppenlift-2` (same — no dedicated mobile funnel yet) |

The widget auto-detects mobile vs. desktop and picks the matching funnel.
Stairlift is the exception: only one funnel exists so far, so both device classes
resolve to the same URL. `FUNNEL_MOBILE_BASE` in the file is the single place to
change if a mobile funnel is added later.

## Parameter breakdown

Every tile link carries the following query parameters.

### Heat pump

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `utm_source` | `welt.de` | Traffic source (Tableau) |
| `utm_medium` | `advertorial` | Medium (Tableau) |
| `utm_campaign` | `hp_june26` | Campaign + launch month (Tableau) |
| `bcid` | `3jf95jdleq` | Overrides Heyflow default campaign → **Heat Pump DACH 3** |
| `publisher` | `Welt` | Stored in Zapier |
| `publisher-content` | `welt-heat-pump-article` | Free-form label (Zapier → Tableau) |
| `utm_content` | state code (e.g. `BY`) | Which tile was clicked |
| `bundesland` | state code | Pre-selects the state in the funnel |
| `#building-type` | (hash) | Pre-selects building type in Heyflow |

**Resulting link (desktop, example for Bayern):**
```
https://vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-desktop-2?utm_source=welt.de&utm_medium=advertorial&utm_campaign=hp_june26&bcid=3jf95jdleq&publisher=Welt&publisher-content=welt-heat-pump-article&utm_content=BY&bundesland=BY#building-type
```

### Solar / Photovoltaik

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `utm_source` | `welt.de` | Traffic source (Tableau) |
| `utm_medium` | `advertorial` | Medium (Tableau) |
| `utm_campaign` | `solar_june26` | Campaign + launch month (Tableau) |
| `bcid` | `usjr74ngzs` | Overrides Heyflow default campaign → **Solar DACH 3** |
| `publisher` | `Welt` | Stored in Zapier |
| `publisher-content` | `welt-solar-article` | Free-form label (Zapier → Tableau) |
| `utm_content` | state code (e.g. `BY`) | Which tile was clicked |
| `#immobilie` | (hash) | Pre-selects property type in Heyflow |

**Resulting link (desktop, example for Bayern):**
```
https://vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-desktop3?utm_source=welt.de&utm_medium=advertorial&utm_campaign=solar_june26&bcid=usjr74ngzs&publisher=Welt&publisher-content=welt-solar-article&utm_content=BY#immobilie
```

### Stairlift / Treppenlift

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `utm_source` | `welt.de` | Traffic source (Tableau) |
| `utm_medium` | `advertorial` | Medium (Tableau) |
| `utm_campaign` | `tl_aug26` | Campaign + launch month (Tableau) |
| `bcid` | `m6ujzemskr` | Overrides Heyflow default campaign → **Stairlift DACH 3** |
| `publisher` | `Welt` | Stored in Zapier |
| `publisher-content` | `welt-treppenlift-article` | Free-form label (Zapier → Tableau) |
| `utm_content` | `bundesland_<code>` (e.g. `bundesland_by`) | Which tile was clicked |
| `#lift-type` | (hash) | Pre-selects lift type in Heyflow |

> ⚠️ `utm_content` on this widget uses the lowercase `bundesland_xx` form (per the
> campaign spec), **not** the bare uppercase state code used by heat pump and solar.
> Expect two different shapes in Tableau.

**Resulting link (example for Bayern):**
```
https://www.top10-anbieter.de/treppenlift-2?utm_source=welt.de&utm_medium=advertorial&utm_campaign=tl_aug26&bcid=m6ujzemskr&publisher=Welt&publisher-content=welt-treppenlift-article&utm_content=bundesland_by#lift-type
```

### bcid reference

bcid overrides the Heyflow funnel's default campaign so leads/revenue land on the
correct campaign in Tableau. Values verified against the
[Campaigns table](https://tables.zapier.com/app/tables/t/01HFQD08J2PFD93ZMZEYQRAS8F)
(last checked 2026-06-09):

| Campaign | bcid |
|----------|------|
| Heat Pump DACH 3 | `3jf95jdleq` |
| Solar DACH 3 | `usjr74ngzs` |
| Stairlift DACH 3 | `m6ujzemskr` (verified 2026-08-21) |

> ⚠️ If the browser strips the `bcid`, that lead falls back to the funnel's
> default campaign. Keep it on every outgoing link.

### Ad-click passthrough (LIVE)

Both widgets forward `gclid`, `wbraid`, `gbraid`, `msclkid`, `matchtype`,
`keyword`, `placement`, and `device` from the page URL / referrer to the tile
links, for Google/Microsoft Ads attribution. `utm_source` / `utm_campaign` are
deliberately **not** forwarded — they stay hardcoded to `welt.de` / `hp_june26`
so advertorial traffic always attributes to Welt. The passthrough is **live**
since 2026-07-02: Welt's pages run a forwarding script that appends the article
URL's params (`utm_*`, `gclid`, `wbraid`, `gbraid`) to the widget iframe `src`,
where the widget picks them up. Verified end-to-end 2026-07-03, re-verified
2026-07-22. This feeds the offline conversion uploads on the Google Ads account.
See `CONTEXT.md` for the full story.

## Notes

- `utm_campaign` carries a month tag (`june26` for HP/solar, `aug26` for stairlift). **Frozen once live** — Welt charges for post-go-live changes, so each stays at its launch month until bundled with another change. Don't expect it to track the current month.
- The `publisher` / `publisher-content` params come from the bcid system spec
  (Niklas, 29 Apr 2026) — stored in Zapier for Tableau evaluations.
- Article CTA links (outside the iframe, managed by Welt editorial) must carry the
  same `bcid` + `publisher` + `publisher-content` — see `CONTEXT.md`.
