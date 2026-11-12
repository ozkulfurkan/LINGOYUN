import { animalArt } from './animals';
import { animalSmallArt } from './animals-small';
import { animalWildArt } from './animals-wild';
import { produceArt } from './produce';
import { mealArt } from './meals';
import { wardrobeArt } from './wardrobe';
import { householdArt } from './household';
import { playthingArt } from './playthings';
import { oppositeArt } from './opposites';
import { outdoorArt } from './outdoors';
import { clothesArt } from './clothes';
import { foodArt } from './food';
import { homeArt } from './home';
import { natureArt } from './nature';
import { toyArt } from './toys';
import { vehicleArt } from './vehicles';
import type { WordArtComponent, WordArtMap } from './WordCanvas';

export {
  WORD_ART_SIZE,
  type WordArtComponent,
  type WordArtMap,
  type WordArtProps,
} from './WordCanvas';

// Image id (`concept.image` in src/content/concepts) → drawn picture.
// Each group lives in its own file so batches can be drawn in parallel; a new
// group only adds one line here.
const WORD_ART: WordArtMap = {
  ...animalArt,
  ...foodArt,
  ...clothesArt,
  ...homeArt,
  ...toyArt,
  ...natureArt,
  ...vehicleArt,
  ...animalSmallArt,
  ...animalWildArt,
  ...produceArt,
  ...mealArt,
  ...wardrobeArt,
  ...householdArt,
  ...playthingArt,
  ...oppositeArt,
  ...outdoorArt,
};

/** Image ids that have a drawn picture. */
export const WORD_ART_IDS: readonly string[] = Object.keys(WORD_ART);

/** The picture for an image id, or null if it is not drawn (yet). */
export function wordArt(imageId: string | null | undefined): WordArtComponent | null {
  if (!imageId || !Object.hasOwn(WORD_ART, imageId)) return null;
  return WORD_ART[imageId];
}
