#!/usr/bin/env node
// Records the spoken parts of the 2-7 mode with Azure Speech, once, so the app
// plays real voices offline instead of the phone's speech engine.
//
//   npm run voices            record what is missing, then write the clip index
//   npm run voices -- --force record everything again (e.g. after a voice change)
//
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env (never committed).
// Writes assets/audio/voice/<lang>/<name>.mp3 and src/lib/voiceClips.ts.
// Texts the app speaks that have no clip fall back to the phone's speech.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')),
  '..',
);
const OUT = path.join(ROOT, 'assets/audio/voice');
const INDEX = path.join(ROOT, 'src/lib/voiceClips.ts');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// Furkan chose the voices (2026-11-13): Emel for Turkish, Jenny for English.
// A little slower than normal: the listeners are 2-7 years old.
const VOICES = {
  tr: { locale: 'tr-TR', name: 'tr-TR-EmelNeural' },
  en: { locale: 'en-US', name: 'en-US-JennyNeural' },
};
const RATE = '-10%';

// Interface lines the 2-7 screens speak (i18n keys), in every language.
// Lines with a nickname are not recorded; the screens speak a version without it.
const LINE_KEYS = [
  'mini.homeHelloSpoken',
  'mini.listen',
  'mini.basket',
  'mini.read',
  'mini.memory',
  'mini.right',
  'mini.tryAgain',
  'mini.done',
  'mini.albumHello',
  'mini.pageFull',
  'mini.newStickers_one',
  'mini.worlds.animals',
  'mini.worlds.food',
  'mini.worlds.colors',
  'mini.worlds.body',
  'mini.worlds.home',
  'mini.worlds.nature',
];
// "{{count}} yeni çıkartma!" for the counts a session can give (2, or 3 when perfect).
const STICKER_COUNTS = [2, 3];

const get = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj);

function collect() {
  const clips = [];
  for (const lang of Object.keys(VOICES)) {
    const ui = read(`src/i18n/${lang}.json`);
    for (const key of LINE_KEYS) {
      const text = get(ui, key);
      if (typeof text !== 'string') throw new Error(`missing ${lang} text ${key}`);
      clips.push({ lang, name: key, text });
    }
    for (const n of STICKER_COUNTS) {
      const text = get(ui, 'mini.newStickers_other').replace('{{count}}', String(n));
      clips.push({ lang, name: `mini.newStickers.${n}`, text });
    }
  }
  // Every word of the 2-7 mode, in the course's target language (English).
  const words = read('src/content/languages/en/words.json');
  for (const f of fs.readdirSync(path.join(ROOT, 'src/content/concepts'))) {
    for (const c of read(`src/content/concepts/${f}`)) {
      if (!c.ageGroups.includes('mini')) continue;
      const text = words[c.id]?.text;
      if (!text) throw new Error(`no English text for ${c.id}`);
      clips.push({ lang: 'en', name: c.id, text });
    }
  }
  // One recording per text: "orange" is both a colour and a fruit.
  const seen = new Set();
  return clips.filter((c) => {
    const key = `${c.lang}|${c.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function record({ lang, text }, key, region) {
  const voice = VOICES[lang];
  const ssml = `<speak version="1.0" xml:lang="${voice.locale}"><voice name="${voice.name}"><prosody rate="${RATE}">${escape(text)}</prosody></voice></speak>`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'lingoyun-voices',
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // The free tier allows about 20 requests a minute: wait and try again.
    if (res.status === 429) {
      await sleep(15_000);
      continue;
    }
    throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error('still rate limited');
}

async function main() {
  process.loadEnvFile(path.join(ROOT, '.env'));
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region)
    throw new Error('AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are needed in .env');
  const force = process.argv.includes('--force');
  const clips = collect();
  let made = 0;
  for (const clip of clips) {
    const file = path.join(OUT, clip.lang, `${clip.name}.mp3`);
    if (!force && fs.existsSync(file)) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, await record(clip, key, region));
    made++;
    if (made % 20 === 0) console.log(`${made} recorded…`);
    await sleep(3_000);
  }

  // Index: "<lang>|<text>" → bundled clip. The app looks texts up by what it says.
  const lines = clips
    .filter((c) => fs.existsSync(path.join(OUT, c.lang, `${c.name}.mp3`)))
    .map(
      (c) =>
        `  ${JSON.stringify(`${c.lang}|${c.text}`)}: require('../../assets/audio/voice/${c.lang}/${c.name}.mp3'),`,
    );
  fs.writeFileSync(
    INDEX,
    [
      '// Generated by scripts/voices.mjs (npm run voices). Do not edit by hand.',
      '',
      '/** Recorded voice clips by "<language>|<text>". */',
      'export const VOICE_CLIPS: Readonly<Record<string, number>> = {',
      ...lines,
      '};',
      '',
    ].join('\n'),
  );
  execSync(`npx prettier --write "${INDEX}"`, { cwd: ROOT, stdio: 'ignore' });
  console.log(`${made} recorded, ${lines.length} clips in the index`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
