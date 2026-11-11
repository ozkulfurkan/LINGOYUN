import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ARM_POSES, CHARACTER_IDS, CHARACTERS, EXPRESSIONS } from './index';

describe('characters', () => {
  it.each(CHARACTER_IDS.flatMap((id) => EXPRESSIONS.map((e) => [id, e] as const)))(
    'renders %s with the %s expression',
    async (id, expression) => {
      const { Component } = CHARACTERS[id];
      const { toJSON } = await render(<Component expression={expression} size={120} />);
      expect(toJSON()).toBeTruthy();
    },
  );

  it.each(CHARACTER_IDS)('renders a %s portrait', async (id) => {
    const { Component } = CHARACTERS[id];
    const { toJSON } = await render(<Component framing="portrait" size={64} />);
    expect(toJSON()).toBeTruthy();
  });

  it('wraps every animatable part when a wrapper is given', async () => {
    const wrap = (name: string) =>
      function Wrapper({ children }: { children: ReactNode }) {
        return <View testID={name}>{children}</View>;
      };
    const { Component } = CHARACTERS.kerem;
    await render(
      <Component
        parts={{
          figure: wrap('figure'),
          head: wrap('head'),
          armLeft: wrap('armLeft'),
          armRight: wrap('armRight'),
          eyes: wrap('eyes'),
          mouth: wrap('mouth'),
          accessory: wrap('accessory'),
        }}
      />,
    );
    for (const part of ['figure', 'head', 'armLeft', 'armRight', 'eyes', 'mouth', 'accessory']) {
      expect(screen.getByTestId(part)).toBeTruthy();
    }
  });

  it('keeps the height order Zeynep > Nehir > Kerem (higher neck = taller)', () => {
    const [zeynep, nehir, kerem] = CHARACTER_IDS.map((id) => CHARACTERS[id].rig.neck.y);
    expect(zeynep).toBeLessThan(nehir);
    expect(nehir).toBeLessThan(kerem);
  });

  it('raises the arms when happy', () => {
    expect(ARM_POSES.happy.left).toBeGreaterThan(90);
    expect(ARM_POSES.idle.left).toBeLessThan(90);
  });
});
