// Device-detection regression test for the Bundesland widgets.
//
// Runs the ACTUAL isMobile() shipped in each widget HTML (extracted verbatim,
// not a copy) against the scenarios that broke on welt.de's cross-origin
// iframe. Run with:  node test/device-detection.test.mjs
//
// Background: the widgets are embedded in a cross-origin iframe on welt.de.
// Reading window.top.innerWidth there throws a SecurityError; the old code let
// that throw skip its width fallback, collapsing detection to UA sniffing and
// routing mobile users (in-app webviews, iPadOS-as-Mac, UA-normalized browsers)
// to the desktop funnel. The iframe is capped at max-width:1000px, so detection
// must NOT treat the iframe's own width against a 1024 threshold as "mobile".

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
  // Guard: the cross-origin bug was a literal window.top read. Never reintroduce.
  if (/window\s*\.\s*top/.test(fnSrc)) {
    throw new Error(`${file}: isMobile() reads window.top — throws in a cross-origin iframe`);
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

const FILES = ['bundesland-widget-heat-pump.html', 'bundesland-widget-iframe.html'];

// Each case: a label, the matchMedia query results, the navigator mock, and the
// expected isMobile() return. Applied identically to BOTH widgets.
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
    name: '(c) desktop on the 1000px-capped iframe -> desktop (NOT mobile)',
    env: {
      // viewport ~1000px: phone query false; pointer fine; 1024 query matches
      // but is gated behind coarse-pointer, so it must NOT flip to mobile.
      queries: { '(max-width: 767px)': false, '(pointer: coarse)': false, '(max-width: 1024px)': true },
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
