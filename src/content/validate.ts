import { findCourse, LANGUAGE_CODES } from '@/features/languages';
import { PROFILE_TYPES } from '@/features/profiles/types';

import type { ContentBundle, ContentIssue, Entry } from './types';

const CONCEPT_ID = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;
const KINDS = ['word', 'phrase', 'idiom', 'sentence'];

/**
 * Checks the whole content bundle. Errors must be fixed before shipping;
 * warnings (e.g. translations marked for review) are reported but allowed.
 */
export function validateContent(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const error = (where: string, message: string) =>
    issues.push({ severity: 'error', where, message });
  const warn = (where: string, message: string) =>
    issues.push({ severity: 'warning', where, message });

  // Concepts
  const concepts = new Map<string, ContentBundle['concepts'][number]>();
  for (const c of bundle.concepts) {
    const where = `concepts › ${c.id}`;
    if (concepts.has(c.id)) error(where, 'duplicate concept id');
    concepts.set(c.id, c);
    if (!CONCEPT_ID.test(c.id)) error(where, 'id must look like "topic.name" (lowercase)');
    if (!c.topic.trim()) error(where, 'topic is empty');
    if (!KINDS.includes(c.kind)) error(where, `unknown kind "${c.kind}"`);
    if (c.ageGroups.length === 0) error(where, 'ageGroups is empty');
    for (const g of c.ageGroups) {
      if (!(PROFILE_TYPES as readonly string[]).includes(g))
        error(where, `unknown age group "${g}"`);
    }
    if (c.ageGroups.includes('mini') && !c.image) error(where, 'concepts for mini need an image');
  }

  // Language entries
  for (const code of LANGUAGE_CODES) {
    const lang = bundle.languages[code];
    if (!lang) {
      error(`languages/${code}`, 'language content is missing');
      continue;
    }
    for (const file of ['words', 'sentences'] as const) {
      for (const [id, entry] of Object.entries(lang[file])) {
        const where = `languages/${code}/${file}.json › ${id}`;
        const concept = concepts.get(id);
        if (!concept) {
          error(where, 'entry for unknown concept');
          continue;
        }
        const isSentence = concept.kind === 'sentence';
        if (isSentence !== (file === 'sentences')) {
          error(
            where,
            `kind "${concept.kind}" belongs in ${isSentence ? 'sentences' : 'words'}.json`,
          );
        }
        checkEntry(entry, where, error);
        if (entry.review) warn(where, 'translation marked for review');
      }
    }
  }

  // Same text for two concepts in one language (homonyms such as "orange"):
  // allowed, but worth a look; the quiz generator keeps them apart.
  for (const code of LANGUAGE_CODES) {
    const lang = bundle.languages[code];
    if (!lang) continue;
    const byText = new Map<string, string>();
    for (const [id, entry] of [...Object.entries(lang.words), ...Object.entries(lang.sentences)]) {
      const key = entry.text.toLowerCase();
      const other = byText.get(key);
      if (other) warn(`languages/${code} › ${id}`, `same text as ${other}: "${entry.text}"`);
      else byText.set(key, id);
    }
  }

  // Courses
  const courseIds = new Set<string>();
  for (const course of bundle.courses) {
    const def = findCourse(course.id);
    if (courseIds.has(course.id)) error(`courses/${course.id}`, 'duplicate course');
    courseIds.add(course.id);
    if (!def) {
      error(`courses/${course.id}`, 'no CourseDef in src/features/languages/courses.ts');
      continue;
    }
    const unitIds = new Set<string>();
    for (const unit of course.units) {
      const where = `courses/${course.id} › ${unit.id}`;
      if (unitIds.has(unit.id)) error(where, 'duplicate unit id');
      unitIds.add(unit.id);
      if (unit.concepts.length === 0) error(where, 'unit has no concepts');

      if (unit.profileType === 'mini') {
        if (unit.level !== undefined) error(where, 'mini units are worlds and have no level');
      } else if (!unit.level || !def.levels[unit.profileType].includes(unit.level)) {
        error(where, `level must be one of ${def.levels[unit.profileType].join(', ')}`);
      }

      const seen = new Set<string>();
      for (const id of unit.concepts) {
        if (seen.has(id)) error(where, `concept ${id} listed twice`);
        seen.add(id);
        const concept = concepts.get(id);
        if (!concept) {
          error(where, `unknown concept ${id}`);
          continue;
        }
        if (!concept.ageGroups.includes(unit.profileType)) {
          error(where, `concept ${id} is not meant for ${unit.profileType}`);
        }
        const file = concept.kind === 'sentence' ? 'sentences' : 'words';
        for (const code of [def.nativeLang, def.targetLang]) {
          if (!bundle.languages[code]?.[file][id]) {
            error(where, `concept ${id} has no ${code} text`);
          }
        }
      }
    }
  }

  return issues;
}

function checkEntry(entry: Entry, where: string, error: (w: string, m: string) => void) {
  const texts = [entry.text, ...(entry.alt ?? [])];
  for (const t of texts) {
    if (!t.trim()) error(where, 'empty text');
    else if (t !== t.trim() || /\s{2,}/.test(t)) error(where, `extra spaces in "${t}"`);
  }
  if (new Set(texts).size !== texts.length) error(where, 'alt repeats the text or itself');
}
