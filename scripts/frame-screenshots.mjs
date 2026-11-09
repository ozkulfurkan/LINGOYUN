// Turns raw phone screenshots into store screenshots with a caption on top.
//
//   store/screenshots/raw/<locale>/01.png … 06.png   (phone screenshots, .png or .jpg)
//   → store/screenshots/<locale>/app-store/01.png     1290×2796 (iPhone 6.7"/6.9")
//   → store/screenshots/<locale>/play/01.png          1080×1920 (Play phone)
//
// Captions come from store/listings.json (screenshotCaptions, same order).
// Locales: tr-TR, en-US. Missing raw files are skipped.
// Run: node scripts/frame-screenshots.mjs  (locally: NODE_PATH=$(npm root -g) …)
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
// require() (unlike import) also finds a globally installed Playwright via NODE_PATH.
const { chromium } = require('playwright');

const root = resolve(import.meta.dirname, '..');
const listings = JSON.parse(readFileSync(resolve(root, 'store/listings.json'), 'utf8'));

const TARGETS = [
  { name: 'app-store', width: 1290, height: 2796 },
  { name: 'play', width: 1080, height: 1920 },
];

// Mirrors kidsTheme (src/theme/themes.ts): clay peach, ink brown, berry accent.
const BACKGROUND = 'radial-gradient(circle at 30% 0%, #FFF0E0, #FFE6CF 45%, #FFD3AE)';
const TEXT = '#4A2C2A';
const ACCENT = '#E64570';
// The title font of the app, embedded so the caption renders exactly like the app.
const font = readFileSync(
  require.resolve('@expo-google-fonts/dynapuff/700Bold/DynaPuff_700Bold.ttf', { paths: [root] }),
).toString('base64');

const escapeHtml = (text) =>
  text.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
  );

const browser = await chromium.launch();
const page = await browser.newPage();
let written = 0;

for (const [locale, listing] of Object.entries(listings)) {
  for (const [index, caption] of listing.screenshotCaptions.entries()) {
    const number = String(index + 1).padStart(2, '0');
    const raw = ['png', 'jpg', 'jpeg']
      .map((extension) => resolve(root, 'store/screenshots/raw', locale, `${number}.${extension}`))
      .find((path) => existsSync(path));
    if (!raw) continue;
    const mime = raw.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const image = `data:${mime};base64,${readFileSync(raw).toString('base64')}`;

    for (const { name, width, height } of TARGETS) {
      const unit = width / 100;
      await page.setViewportSize({ width, height });
      await page.setContent(`
        <style>@font-face{font-family:DynaPuff;src:url(data:font/ttf;base64,${font})}</style>
        <body style="margin:0;width:${width}px;height:${height}px;background:${BACKGROUND};
          display:flex;flex-direction:column;align-items:center;box-sizing:border-box;
          padding:${unit * 9}px ${unit * 7}px 0;gap:${unit * 6}px;overflow:hidden;font-family:DynaPuff">
          <div style="color:${TEXT};font-size:${unit * 7.4}px;line-height:1.15;text-align:center;
            max-width:92%">${escapeHtml(caption)}</div>
          <div style="width:${unit * 14}px;height:${unit * 1.2}px;border-radius:99px;background:${ACCENT}"></div>
          <img src="${image}" style="flex:1;min-height:0;max-width:100%;object-fit:contain;
            object-position:top;border-radius:${unit * 5}px ${unit * 5}px 0 0;
            box-shadow:0 0 0 ${unit * 0.6}px #EAD5BF, 0 ${unit * 2}px ${unit * 8}px rgba(74,44,42,0.25)">
        </body>`);
      await page.evaluate(() => document.fonts.ready);
      const out = resolve(root, 'store/screenshots', locale, name);
      mkdirSync(out, { recursive: true });
      await page.screenshot({ path: resolve(out, `${number}.png`) });
      written += 1;
    }
  }
}

await browser.close();
console.log(`wrote ${written} screenshots`);
