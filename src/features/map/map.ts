import { unitsFor, type ContentBundle, type Theme } from '@/content';
import { findCourse, type CourseId } from '@/features/languages';
import { MIN_LEVEL_CONCEPTS } from '@/features/placement/session';
import { masteryOf, type Deck } from '@/features/srs';

/** Share of a level's concepts in review box 3+ that opens the next level. */
export const LEVEL_DONE_MASTERY = 0.8;

export type LevelState = 'done' | 'current' | 'locked';

export type LevelNode = {
  level: string;
  /** Concepts of the level; 0 when its content is not written yet. */
  conceptCount: number;
  /**
   * Enough content to play the level (same bar as the placement test). A level
   * with only a few sample concepts is shown as "coming soon".
   */
  playable: boolean;
  /** 0–1, share of the level's concepts learned (box 3+). */
  mastery: number;
  state: LevelState;
  /** Spoken and shown name, e.g. "3. Numbers"; the level id when unset. */
  name?: string;
};

type Leveled = 'kid' | 'adult';

/** A level can be played (and moved up to) only with this much content. */
export function hasEnoughContent(concepts: readonly string[]): boolean {
  return concepts.length >= MIN_LEVEL_CONCEPTS;
}

/** Concepts of one level, in course order, without duplicates. */
export function levelConcepts(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: Leveled,
  level: string,
): string[] {
  return [...new Set(unitsFor(bundle, courseId, profileType, level).flatMap((u) => u.concepts))];
}

/** Every level of the course for the map: below the current one done, above it locked. */
export function levelNodes(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: Leveled,
  deck: Deck,
  currentLevel: string,
): LevelNode[] {
  const scale = findCourse(courseId)?.levels[profileType] ?? [];
  const current = scale.indexOf(currentLevel);
  return scale.map((level, i) => {
    const concepts = levelConcepts(bundle, courseId, profileType, level);
    return {
      level,
      conceptCount: concepts.length,
      playable: hasEnoughContent(concepts),
      mastery: masteryOf(deck, concepts),
      state: i < current ? 'done' : i === current ? 'current' : 'locked',
    };
  });
}

/**
 * The level to move up to after practising, or null: the current level must be
 * mastered and the next level must have content.
 */
export function levelUpTarget(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: Leveled,
  deck: Deck,
  currentLevel: string,
): string | null {
  const scale = findCourse(courseId)?.levels[profileType] ?? [];
  const i = scale.indexOf(currentLevel);
  const next = scale[i + 1];
  if (i < 0 || !next) return null;
  const concepts = levelConcepts(bundle, courseId, profileType, currentLevel);
  if (concepts.length === 0 || masteryOf(deck, concepts) < LEVEL_DONE_MASTERY) return null;
  return hasEnoughContent(levelConcepts(bundle, courseId, profileType, next)) ? next : null;
}

/**
 * The learning path for the map: one stop per theme, numbered from 1. Themes
 * before the current one are done, later ones locked; `mastery` is the share
 * of the theme's words learned (box 3+).
 */
export function themeNodes(
  themes: readonly Theme[],
  currentIndex: number,
  deck: Deck,
  name: (theme: Theme, number: number) => string,
): LevelNode[] {
  return themes.map((theme, i) => ({
    level: String(i + 1),
    name: name(theme, i + 1),
    conceptCount: theme.words.length,
    playable: theme.words.length > 0,
    mastery: masteryOf(deck, theme.words),
    state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'locked',
  }));
}

export type Point = { x: number; y: number };

type LayoutOptions = {
  width: number;
  /** Vertical distance between two stops. */
  step: number;
  /** Space above the first and below the last stop. */
  padding: number;
};

/**
 * Stops along a river winding down the screen, first level at the top. The
 * river is a smooth path through the stops, swinging left and right.
 */
export function riverLayout(
  count: number,
  { width, step, padding }: LayoutOptions,
): { points: Point[]; path: string; height: number } {
  const swing = [0.28, 0.72];
  const points = Array.from({ length: count }, (_, i) => ({
    x: Math.round(width * swing[i % 2]),
    y: padding + i * step,
  }));
  const height = count === 0 ? 0 : padding * 2 + (count - 1) * step;
  if (points.length === 0) return { points, path: '', height };

  // Enter from above and leave below so the river runs edge to edge.
  const start = { x: points[0].x, y: 0 };
  const end = { x: points[points.length - 1].x, y: height };
  const stops = [start, ...points, end];
  let path = `M ${start.x} ${start.y}`;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    const midY = (a.y + b.y) / 2;
    path += ` C ${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`;
  }
  return { points, path, height };
}
