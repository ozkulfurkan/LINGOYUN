import { createElement } from 'react';

import { wordArt } from './index';

/** Draws the picture of a word by its image id; nothing when it has none. */
export function WordPicture({ image, size }: { image: string | undefined; size: number }) {
  const art = wordArt(image);
  // createElement: the component comes from a static registry, not made per render.
  return art ? createElement(art, { size }) : null;
}
