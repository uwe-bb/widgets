# Welt Bundesland Widgets

Self-hosted German-state ("Bundesland") selector widgets embedded in the Welt.de
advertorials for **Heat Pump** and **Solar / Photovoltaik**. A user picks their
state and is routed to the corresponding funnel with full tracking attached.

Hosted via GitHub Pages at `https://uwe-bb.github.io/widgets/`.

## Files

| File | Purpose |
|------|---------|
| `bundesland-widget-heat-pump.html` | Heat pump tile selector (iframe) |
| `bundesland-widget-iframe.html` | Solar / PV tile selector (iframe) |
| `CONTEXT.md` | Full project background, architecture, and open items |

The Welt advertorials embed these HTML files directly via a raw `<iframe>` tag.

## Funnel destinations (iframe tile clicks)

| Widget | Desktop | Mobile |
|--------|---------|--------|
| Heat pump | `vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-desktop-2` | `vergleich.top10-waermepumpen-angebotsvergleich.de/waermepumpe-mobile-2` |
| Solar | `vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-desktop3` | `vergleich.top10-photovoltaikanlage-angebotsvergleich.de/solar-mobile3` |

The widget auto-detects mobile vs. desktop and picks the matching funnel.

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

### bcid reference

bcid overrides the Heyflow funnel's default campaign so leads/revenue land on the
correct campaign in Tableau. Values verified against the
[Campaigns table](https://tables.zapier.com/app/tables/t/01HFQD08J2PFD93ZMZEYQRAS8F)
(last checked 2026-06-09):

| Campaign | bcid |
|----------|------|
| Heat Pump DACH 3 | `3jf95jdleq` |
| Solar DACH 3 | `usjr74ngzs` |

> ⚠️ If the browser strips the `bcid`, that lead falls back to the funnel's
> default campaign. Keep it on every outgoing link.

### Ad-click passthrough (dormant)

Both widgets also try to forward `gclid`, `msclkid`, `matchtype`, `keyword`,
`placement`, and `device` from the page URL / referrer to the tile links, for
Google/Microsoft Ads attribution. `utm_source` / `utm_campaign` are deliberately
**not** forwarded — they stay hardcoded to `welt.de` / `hp_june26` so advertorial
traffic always attributes to Welt. The passthrough is currently **dormant**: Welt's
referrer policy strips the params and Welt IT declined to add a forwarding script,
so nothing arrives. See `CONTEXT.md` for the full story.

## Notes

- `utm_campaign` carries a month tag (`june26`). Bump it per campaign launch month.
- The `publisher` / `publisher-content` params come from the bcid system spec
  (Niklas, 29 Apr 2026) — stored in Zapier for Tableau evaluations.
- Article CTA links (outside the iframe, managed by Welt editorial) must carry the
  same `bcid` + `publisher` + `publisher-content` — see `CONTEXT.md`.
