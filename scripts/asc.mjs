// Minimal App Store Connect API client (no dependencies).
// Key: .secrets/AuthKey_<KEY_ID>.p8 (never committed). IDs from the environment
// or the defaults below (they are not secret).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')),
  '..',
);
export const KEY_ID = process.env.ASC_KEY_ID ?? '6964RK3KS6';
export const ISSUER_ID = process.env.ASC_ISSUER_ID ?? 'd6eeaa56-2ebd-4d14-86db-ead2e8950ad5';
export const KEY_PATH = path.join(ROOT, '.secrets', `AuthKey_${KEY_ID}.p8`);
export const BUNDLE_ID = 'com.ozkulfurkan.lingoyun';

const b64url = (data) => Buffer.from(data).toString('base64url');

function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' }),
  );
  const signature = crypto.sign('sha256', Buffer.from(`${header}.${payload}`), {
    key: fs.readFileSync(KEY_PATH),
    dsaEncoding: 'ieee-p1363',
  });
  return `${header}.${payload}.${b64url(signature)}`;
}

/** Calls the API; throws with Apple's error details on failure. */
export async function asc(method, url, body) {
  const res = await fetch(
    url.startsWith('http') ? url : `https://api.appstoreconnect.apple.com${url}`,
    {
      method,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = json?.errors?.map((e) => `${e.title}: ${e.detail}`).join(' | ') ?? text;
    throw new Error(`${method} ${url} → ${res.status} ${detail}`);
  }
  return json;
}

export async function findApp() {
  const { data } = await asc('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
  if (!data.length) throw new Error(`no app for ${BUNDLE_ID}`);
  return data[0];
}
