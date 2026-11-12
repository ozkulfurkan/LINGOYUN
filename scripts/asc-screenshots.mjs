#!/usr/bin/env node
// Uploads the framed store screenshots to App Store Connect, replacing what is
// there, in file order.
//
//   node scripts/asc-screenshots.mjs
//
// Source: store/screenshots/<locale>/app-store/01.png … (1290×2796, iPhone 6.7"/6.9").
// Only Turkish screenshots are uploaded (Furkan, 2026-11-13); the English page
// shows the primary language's screenshots.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { asc, findApp } from './asc.mjs';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')),
  '..',
);
const SETS = [{ dir: 'tr-TR', locale: 'tr', displayType: 'APP_IPHONE_67' }];

async function screenshotSet(localizationId, displayType) {
  const { data } = await asc(
    'GET',
    `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`,
  );
  const found = data.find((s) => s.attributes.screenshotDisplayType === displayType);
  if (found) return found.id;
  const created = await asc('POST', '/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: localizationId },
        },
      },
    },
  });
  return created.data.id;
}

async function upload(setId, file) {
  const bytes = fs.readFileSync(file);
  const { data: shot } = await asc('POST', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName: path.basename(file), fileSize: bytes.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } },
    },
  });
  for (const op of shot.attributes.uploadOperations) {
    const headers = Object.fromEntries(op.requestHeaders.map((h) => [h.name, h.value]));
    const res = await fetch(op.url, {
      method: op.method,
      headers,
      body: bytes.subarray(op.offset, op.offset + op.length),
    });
    if (!res.ok) throw new Error(`upload part of ${file} → ${res.status}`);
  }
  await asc('PATCH', `/v1/appScreenshots/${shot.id}`, {
    data: {
      type: 'appScreenshots',
      id: shot.id,
      attributes: {
        uploaded: true,
        sourceFileChecksum: crypto.createHash('md5').update(bytes).digest('hex'),
      },
    },
  });
  return shot.id;
}

async function main() {
  const app = await findApp();
  const { data: versions } = await asc(
    'GET',
    `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS`,
  );
  const version = versions.find((v) => v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION');
  if (!version) throw new Error('no version in Prepare for Submission');
  const { data: locs } = await asc(
    'GET',
    `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`,
  );

  for (const { dir, locale, displayType } of SETS) {
    const loc = locs.find((l) => l.attributes.locale === locale);
    if (!loc) throw new Error(`no ${locale} localization`);
    const folder = path.join(ROOT, 'store/screenshots', dir, 'app-store');
    const files = fs
      .readdirSync(folder)
      .filter((f) => /\.(png|jpe?g)$/i.test(f))
      .sort()
      .map((f) => path.join(folder, f));
    const setId = await screenshotSet(loc.id, displayType);

    // Replace: remove what is there first.
    const { data: old } = await asc('GET', `/v1/appScreenshotSets/${setId}/appScreenshots`);
    for (const s of old) await asc('DELETE', `/v1/appScreenshots/${s.id}`);

    const ids = [];
    for (const file of files) {
      ids.push(await upload(setId, file));
      console.log(`ok  ${locale} ${path.basename(file)}`);
    }
    await asc('PATCH', `/v1/appScreenshotSets/${setId}/relationships/appScreenshots`, {
      data: ids.map((id) => ({ type: 'appScreenshots', id })),
    });
    console.log(`${locale}: ${ids.length} screenshots in order`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
