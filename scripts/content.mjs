#!/usr/bin/env node
// Builds the learning path from content-src/themes/** into src/content.
//
//   npm run content           write the JSON files, then run the content tests
//   npm run content -- --export   write content-src from the current JSON (one-off)
//   npm run content -- --check    only read and check the sources, write nothing
//
// One file per theme, read in file-name order per profile type:
//   content-src/themes/adult/03-numbers.txt
//
//   @theme adult.numbers        id, never renamed once shipped
//   @title numbers              key under themes.names in src/i18n
//   @band A1                    hidden level for the placement test
//   @words                      vocabulary in teaching order (ten per step)
//   number.one                  an existing concept, by id
//   @kind word noun             kind and tag for the new concepts below
//   number.zero|zero||sıfır|    a new or changed concept: id|en|enAlts|tr|trAlts
//   @sentences 1                easy sentences (2 = medium, 3 = hard)
//   sentence.x|I am here.|I'm here.|Buradayım.|
//
// Alternatives are separated by ";". Text after " # " is a comment.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')),
  '..',
);
const SRC = path.join(ROOT, 'content-src/themes');
const CONTENT = path.join(ROOT, 'src/content');
const PATH_CONCEPTS = path.join(CONTENT, 'concepts/path.json');
const TYPES = ['adult', 'kid'];

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const files = {
  course: path.join(CONTENT, 'courses/tr-en.json'),
  en: {
    words: path.join(CONTENT, 'languages/en/words.json'),
    sentences: path.join(CONTENT, 'languages/en/sentences.json'),
  },
  tr: {
    words: path.join(CONTENT, 'languages/tr/words.json'),
    sentences: path.join(CONTENT, 'languages/tr/sentences.json'),
  },
};

function loadAll() {
  const lang = (code) => ({
    words: read(files[code].words),
    sentences: read(files[code].sentences),
  });
  const concepts = new Map();
  for (const f of fs.readdirSync(path.join(CONTENT, 'concepts'))) {
    for (const c of read(path.join(CONTENT, 'concepts', f))) concepts.set(c.id, { ...c, file: f });
  }
  return { course: read(files.course), en: lang('en'), tr: lang('tr'), concepts };
}

const entry = (text, alts) => {
  const alt = (alts ?? '')
    .split(';')
    .map((a) => a.trim())
    .filter(Boolean);
  return alt.length ? { text: text.trim(), alt } : { text: text.trim() };
};

function build() {
  const { course, en, tr, concepts } = loadAll();
  const pathConcepts = fs.existsSync(PATH_CONCEPTS) ? read(PATH_CONCEPTS) : [];
  const ownIds = new Set(pathConcepts.map((c) => c.id));
  const problems = [];
  const paths = {};
  let defined = 0;
  // Concepts of other files opened to another profile type: file → ids → types.
  const widen = new Map();
  const open = (id, type) => {
    const c = concepts.get(id);
    if (c.ageGroups.includes(type)) return;
    c.ageGroups = [...c.ageGroups, type];
    if (ownIds.has(id)) {
      const own = pathConcepts.find((x) => x.id === id);
      if (!own.ageGroups.includes(type)) own.ageGroups.push(type);
      return;
    }
    if (!widen.has(c.file)) widen.set(c.file, new Map());
    widen.get(c.file).set(id, c.ageGroups);
  };
  const seenIn = { adult: new Map(), kid: new Map() };

  for (const type of TYPES) {
    const dir = path.join(SRC, type);
    if (!fs.existsSync(dir)) continue;
    paths[type] = [];
    for (const name of fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.txt'))
      .sort()) {
      const where = `${type}/${name}`;
      const theme = { id: '', title: '', band: '', words: [], sentences: {} };
      let section = null;
      let kind = 'word';
      let tag = null;
      fs.readFileSync(path.join(dir, name), 'utf8')
        .split(/\r?\n/)
        .forEach((raw, i) => {
          const line = raw.replace(/\s+#\s.*$/, '').trim();
          const at = `${where}:${i + 1}`;
          if (!line || line.startsWith('#')) return;
          const [directive, ...rest] = line.split(/\s+/);
          if (directive === '@theme') return void (theme.id = rest[0]);
          if (directive === '@title') return void (theme.title = rest[0]);
          if (directive === '@band') return void (theme.band = rest[0]);
          if (directive === '@words') return void (section = 'words');
          if (directive === '@sentences') return void (section = rest[0]);
          if (directive === '@kind') return void ([kind, tag = null] = rest);
          if (line.startsWith('@'))
            return void problems.push(`${at} unknown directive ${directive}`);
          if (!section) return void problems.push(`${at} line outside @words or @sentences`);

          const isSentence = section !== 'words';
          const parts = line.split('|');
          const id = parts[0].trim();
          if (parts.length > 1) {
            // Defines or changes a concept and its two texts.
            if (parts.length !== 5) return void problems.push(`${at} needs id|en|enAlts|tr|trAlts`);
            const [, enText, enAlts, trText, trAlts] = parts;
            if (!enText.trim() || !trText.trim()) return void problems.push(`${at} empty text`);
            const bucket = isSentence ? 'sentences' : 'words';
            en[bucket][id] = { ...en[bucket][id], ...entry(enText, enAlts) };
            if (!entry(enText, enAlts).alt) delete en[bucket][id].alt;
            tr[bucket][id] = { ...tr[bucket][id], ...entry(trText, trAlts) };
            if (!entry(trText, trAlts).alt) delete tr[bucket][id].alt;
            if (!concepts.has(id)) {
              const concept = {
                id,
                topic: theme.title || 'path',
                kind: isSentence ? 'sentence' : kind,
                ageGroups: [type],
                ...(tag && !isSentence ? { tags: [tag] } : {}),
              };
              pathConcepts.push(concept);
              ownIds.add(id);
              concepts.set(id, { ...concept, file: 'path.json' });
            } else open(id, type);
            defined++;
          } else if (!concepts.has(id)) {
            return void problems.push(
              `${at} unknown concept ${id} (add its texts: id|en|enAlts|tr|trAlts)`,
            );
          } else open(id, type);
          // A concept is taught in one theme only (per profile type).
          const other = seenIn[type].get(id);
          if (other && other !== theme.id) problems.push(`${at} ${id} is already in ${other}`);
          seenIn[type].set(id, theme.id || where);
          if (isSentence) (theme.sentences[section] ??= []).push(id);
          else theme.words.push(id);
        });
      for (const field of ['id', 'title', 'band']) {
        if (!theme[field]) problems.push(`${where} missing @${field}`);
      }
      paths[type].push(theme);
    }
  }

  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  if (process.argv.includes('--check')) {
    for (const type of TYPES) {
      for (const t of paths[type] ?? []) {
        const tiers = ['1', '2', '3'].map((k) => t.sentences[k]?.length ?? 0).join('/');
        console.log(`${t.id}: ${t.words.length} words, sentences ${tiers}`);
      }
    }
    console.log('check passed: nothing written');
    return;
  }
  course.paths = paths;
  write(files.course, course);
  write(files.en.words, en.words);
  write(files.en.sentences, en.sentences);
  write(files.tr.words, tr.words);
  write(files.tr.sentences, tr.sentences);
  write(PATH_CONCEPTS, pathConcepts);
  for (const [file, ids] of widen) {
    const p = path.join(CONTENT, 'concepts', file);
    write(
      p,
      read(p).map((c) => (ids.has(c.id) ? { ...c, ageGroups: ids.get(c.id) } : c)),
    );
  }
  // Same layout as the rest of the repository, so a rebuild without changes has no diff.
  const written = [
    ...[...widen.keys()].map((f) => path.join(CONTENT, 'concepts', f)),
    files.course,
    files.en.words,
    files.en.sentences,
    files.tr.words,
    files.tr.sentences,
    PATH_CONCEPTS,
  ];
  execSync(`npx prettier --write ${written.map((f) => `"${f}"`).join(' ')}`, {
    cwd: ROOT,
    stdio: 'ignore',
  });
  const counts = TYPES.map((t) => `${t}: ${paths[t]?.length ?? 0} themes`).join(', ');
  console.log(`content built (${counts}; ${defined} texts set)`);
}

function exportSources() {
  const { course, en, tr } = loadAll();
  const show = (lang, id) => {
    const e = lang.words[id] ?? lang.sentences[id];
    return e ? e.text : '?';
  };
  for (const type of TYPES) {
    const dir = path.join(SRC, type);
    fs.mkdirSync(dir, { recursive: true });
    (course.paths?.[type] ?? []).forEach((theme, i) => {
      const lines = [
        `@theme ${theme.id}`,
        `@title ${theme.title}`,
        `@band ${theme.band}`,
        '',
        '@words',
      ];
      for (const id of theme.words) lines.push(`${id} # ${show(en, id)} = ${show(tr, id)}`);
      for (const tier of ['1', '2', '3']) {
        const list = theme.sentences[tier];
        if (!list?.length) continue;
        lines.push('', `@sentences ${tier}`);
        for (const id of list) lines.push(`${id} # ${show(en, id)} = ${show(tr, id)}`);
      }
      const file = `${String(i + 1).padStart(2, '0')}-${theme.title}.txt`;
      fs.writeFileSync(path.join(dir, file), lines.join('\n') + '\n');
    });
  }
  console.log('content-src written');
}

if (process.argv.includes('--export')) exportSources();
else {
  build();
  if (!process.argv.includes('--no-test') && !process.argv.includes('--check')) {
    execSync('npx jest src/content src/features/path src/i18n --silent', {
      stdio: 'inherit',
      cwd: ROOT,
    });
  }
}
