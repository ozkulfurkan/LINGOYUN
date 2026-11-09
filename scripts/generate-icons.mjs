// Renders every app icon and splash PNG from assets/source/glyph.svg.
// Run after editing the SVG:  node scripts/generate-icons.mjs
// Needs Playwright with Chromium (preinstalled in the cloud environment; locally
// `npm i -g playwright && npx playwright install chromium`, then
// NODE_PATH=$(npm root -g) node scripts/generate-icons.mjs).
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

// require() (unlike import) also finds a globally installed Playwright via NODE_PATH.
const { chromium } = createRequire(import.meta.url)('playwright');

const root = resolve(import.meta.dirname, '..');
const glyph = readFileSync(resolve(root, 'assets/source/glyph.svg'), 'utf8').replace(
  /<!--[\s\S]*?-->/g,
  '',
);
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
// Android 13 themed icons: one flat colour, the system tints it. The river
// would merge with the stones into one blob, so only the stones and a thin
// wave line are kept.
const monochrome = glyph
  .replace(/<path class="river"[^>]*d="M-60[^>]*\/>/, '')
  .replace(/<ellipse class="shade"[^>]*\/>/g, '')
  .replace(/fill="url\(#\w+\)"/g, 'fill="#FFFFFF"')
  .replace(/stroke="#[0-9A-F]{6}" stroke-opacity="[\d.]+"/gi, 'stroke="#FFFFFF" stroke-opacity="1"')
  .replace(/<ellipse cx[^>]*fill="#FFF6EC"[^>]*\/>/g, '');

// Mirrors kidsTheme background / backgroundAlt (src/theme/themes.ts).
const gradient = 'radial-gradient(circle at 30% 20%, #FFF0E0, #FFE6CF 45%, #FFD3AE)';

/** size: output pixels; scale: glyph size relative to the canvas; background: CSS or null. */
const outputs = [
  { file: 'assets/icon.png', size: 1024, scale: 1, background: gradient },
  { file: 'assets/favicon.png', size: 48, scale: 1, background: gradient },
  // Android adaptive icons crop to a circle of ~61% of the canvas.
  { file: 'assets/android-icon-foreground.png', size: 1024, scale: 0.7, background: null },
  { file: 'assets/android-icon-background.png', size: 1024, scale: 0, background: gradient },
  {
    file: 'assets/android-icon-monochrome.png',
    size: 1024,
    scale: 0.7,
    background: null,
    svg: monochrome,
  },
  { file: 'assets/splash-icon.png', size: 1024, scale: 1, background: null },
  // Play Console listing icon (512×512, opaque).
  { file: 'store/graphics/play-icon-512.png', size: 512, scale: 1, background: gradient },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, scale, background, svg = glyph } of outputs) {
  await page.setViewportSize({ width: size, height: size });
  const image =
    scale > 0
      ? `<img src="${dataUri(svg)}" style="width:${scale * 100}%;height:${scale * 100}%">`
      : '';
  await page.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px;display:flex;align-items:center;` +
      `justify-content:center;overflow:hidden;background:${background ?? 'transparent'}">${image}</body>`,
  );
  const out = resolve(root, file);
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: background === null });
  console.log(file);
}
await browser.close();
