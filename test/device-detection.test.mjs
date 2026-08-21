// Device-detection regression test for the Bundesland widgets.
//
// Runs the ACTUAL isMobile() shipped in each widget HTML (extracted verbatim,
// not a copy) against the scenarios that broke on welt.de's cross-origin
// iframe. Run with:  node test/device-detection.test.mjs
//
// Background: the widgets are embedded in a cross-origin iframe on welt.de.
// Two failure modes this guards against:
//  1. Reading window.top.innerWidth throws a SecurityError in a cross-origin
//     iframe; the old code let that throw skip its fallback and collapse to UA
//     sniffing.
//  2. The iframe's width is the ARTICLE COLUMN width (< 768px on welt.de), NOT
//     the device width. A later "fix" keyed detection on (max-width: 767px),
//     which then matched for every DESKTOP visitor (narrow column) and routed
//     them to the mobile funnel. So detection must use NO width media queries
//     at all — only device signals (pointer type, UA, touch points).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Pull the isMobile() function source straight out of the shipped HTML by
// balanced-brace matching, so the test exercises the real code, not a copy.
function extractIsMobile(file) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  const start = src.indexOf('function isMobile');
  if (start < 0) throw new Error(`isMobile not found in ${file}`);
  const open = src.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) { i++; break; }
  }
  const fnSrc = src.slice(start, i);
  // Guard 1: the cross-origin bug was a literal window.top read. Never reintroduce.
  if (/window\s*\.\s*top/.test(fnSrc)) {
    throw new Error(`${file}: isMobile() reads window.top — throws in a cross-origin iframe`);
  }
  // Guard 2: width media queries measure the iframe's column width, not the
  // device — that is what routed desktop visitors to the mobile funnel. Never
  // reintroduce (max-width/min-width) into device detection.
  if (/\b(?:max|min)-width\s*:/.test(fnSrc)) {
    throw new Error(`${file}: isMobile() uses a width media query — measures the iframe column, not the device`);
  }
  return fnSrc;
}

// Run the extracted isMobile() inside a sandbox with injected window/navigator.
function runIsMobile(fnSrc, { queries = {}, navigator = {} }) {
  // window.top is a throwing getter to PROVE the code never touches it: if it
  // ever does, these tests blow up instead of silently regressing.
  const win = {
    get top() { throw new Error('SecurityError: cross-origin window.top access'); },
    matchMedia(q) {
      return { matches: !!queries[q], media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
    },
  };
  const nav = { userAgent: '', platform: '', maxTouchPoints: 0, ...navigator };
  const sandbox = { window: win, navigator: nav };
  return vm.runInNewContext(`${fnSrc}\nisMobile();`, sandbox);
}

const FILES = ['bundesland-widget-heat-pump.html', 'bundesland-widget-iframe.html', 'bundesland-widget-stairlift.html'];

// Each case: a label, the matchMedia query results, the navigator mock, and the
// expected isMobile() return. Applied identically to EVERY widget in FILES.
const CASES = [
  {
    name: '(a) cross-origin + matchMedia reports a phone -> mobile',
    env: {
      queries: { '(max-width: 767px)': true, '(pointer: coarse)': true, '(max-width: 1024px)': true },
      navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14)', maxTouchPoints: 5 },
    },
    expect: true,
  },
  {
    name: '(b) fine-pointer wide viewport -> desktop',
    env: {
      queries: { '(max-width: 767px)': false, '(pointer: coarse)': false, '(max-width: 1024px)': false },
      navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 0, platform: 'Win32' },
    },
    expect: false,
  },
  {
    name: '(c) DESKTOP in welt.de narrow iframe column (<768px) -> desktop (NOT mobile)',
    env: {
      // The regression that shipped: the iframe renders in a ~600px article
      // column, so EVERY width query matches even though this is a desktop
      // (fine pointer, no touch). Width-based detection wrongly returned mobile.
      queries: { '(max-width: 767px)': true, '(pointer: coarse)': false, '(max-width: 1024px)': true },
      navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0, platform: 'MacIntel' },
    },
    expect: false,
  },
  {
    name: '(d) iPadOS Safari masquerading as Macintosh -> mobile',
    env: {
      // iPad reports as desktop Mac; matchMedia signals deliberately desktop-ish
      // so only the maxTouchPoints+MacIntel branch can catch it.
      queries: { '(max-width: 767px)': false, '(pointer: coarse)': false, '(max-width: 1024px)': false },
      navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', maxTouchPoints: 5, platform: 'MacIntel' },
    },
    expect: true,
  },
  {
    name: '(e) in-app webview (WELT app) on a phone, UA-only signal -> mobile',
    env: {
      // matchMedia withheld to force the UA branch (covers UA-normalized webviews).
      queries: {},
      navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14; WebView) AppleWebKit', maxTouchPoints: 5 },
    },
    expect: true,
  },
  {
    name: '(f) landscape phone wider than 767 but coarse pointer -> mobile',
    env: {
      queries: { '(max-width: 767px)': false, '(pointer: coarse)': true, '(max-width: 1024px)': true },
      navigator: { userAgent: 'Mozilla/5.0 (iPhone)', maxTouchPoints: 5 },
    },
    expect: true,
  },
];

let failures = 0;
for (const file of FILES) {
  const fnSrc = extractIsMobile(file);
  console.log(`\n${file}`);
  for (const c of CASES) {
    let got;
    try {
      got = runIsMobile(fnSrc, c.env);
    } catch (err) {
      console.log(`  x ${c.name} -- threw: ${err.message}`);
      failures++;
      continue;
    }
    const ok = got === c.expect;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${c.name} (got ${got}, expected ${c.expect})`);
  }
}

console.log(failures ? `\n${failures} failing assertion(s)` : '\nAll device-detection assertions passed');
process.exit(failures ? 1 : 0);
