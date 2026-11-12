import '@/i18n';

import { act, fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { renderRouter } from 'expo-router/testing-library';

import AlbumScreen from '@/app/album';
import HomeScreen from '@/app/index';
import MiniGameScreen from '@/app/play/mini';
import { content } from '@/content/bundle';
import { addProfile, deleteProfile, profilesStore } from '@/features/profiles';
import i18n from '@/i18n';
import { loadProgress } from '@/storage/progress';
import { loadDeck } from '@/storage/srs';
import { loadAlbum, saveAlbum } from '@/storage/stickers';
import { clearTestAccess, startTestTrial } from '../test-support/access';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));

const ROUTES = {
  index: HomeScreen,
  'play/mini': MiniGameScreen,
  album: AlbumScreen,
  paywall: () => null,
  'parent-gate': () => null,
};

function seedMini(): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type: 'mini', courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  return added.value.activeId!;
}

const spoken = () => jest.mocked(Speech.speak).mock.calls.map((c) => c[0]);
const lastSpoken = () => spoken().at(-1) ?? '';

/** The Turkish label of the picture whose English word was just said. */
function labelOf(word: string): string {
  const en = content.languages.en.words;
  const tr = content.languages.tr.words;
  const hits = Object.keys(en)
    .filter((id) => en[id].text === word && tr[id])
    .map((id) => tr[id].text)
    .filter((label) => screen.queryAllByLabelText(label).length > 0);
  if (hits.length === 0) throw new Error(`no picture for ${word}`);
  return hits[0];
}

async function press(label: string) {
  await fireEvent.press(screen.getAllByLabelText(label)[0]);
}

/** Finds the pairs by turning cards, remembering what each one said. */
async function solveMemory() {
  const known = new Map<number, string>();
  const matched = new Set<number>();
  let open: number[] = [];
  const flip = async (i: number) => {
    await press(i18n.t('mini.cardBack', { n: i + 1 }));
    known.set(i, lastSpoken());
  };
  const tryPair = async (a: number, b: number) => {
    await flip(a);
    await flip(b);
    if (known.get(a) === known.get(b)) {
      matched.add(a).add(b);
      open = [];
    } else open = [a, b];
  };
  for (let guard = 0; matched.size < 6 && guard < 20; guard++) {
    const left = [0, 1, 2, 3, 4, 5].filter((i) => !matched.has(i));
    const pair = left.flatMap((a) =>
      left
        .filter((b) => b !== a && known.has(a) && known.get(a) === known.get(b))
        .map((b) => [a, b]),
    )[0];
    if (pair) {
      // Turn the closed one first: that tap also closes a shown mismatch.
      const [a, b] = open.includes(pair[0]) ? [pair[1], pair[0]] : pair;
      await tryPair(a, b);
      continue;
    }
    const unknown = left.filter((i) => !known.has(i) && !open.includes(i));
    const a = unknown[0];
    await flip(a);
    open = [a];
    const partner = left.find((i) => i !== a && known.get(i) === known.get(a));
    const b = partner ?? left.find((i) => i !== a && !known.has(i))!;
    await flip(b);
    if (known.get(a) === known.get(b)) {
      matched.add(a).add(b);
      open = [];
    } else open = [a, b];
  }
}

/** Plays whatever activity is showing, answering right the first time. */
async function playActivity() {
  if (screen.queryByLabelText(i18n.t('mini.cardBack', { n: 1 }))) {
    await solveMemory();
  } else {
    await press(labelOf(lastSpoken()));
  }
  await press(i18n.t('mini.next'));
}

describe('ages 2–7: picture worlds (LNG-33)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.mocked(Speech.speak).mockClear();
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('shows six world cards and greets the child out loud', async () => {
    startTestTrial();
    seedMini();
    await renderRouter(ROUTES, { initialUrl: '/' });
    for (const id of ['animals', 'food', 'colors', 'body', 'home', 'nature']) {
      const world = i18n.t(`mini.worlds.${id}` as 'mini.worlds.animals');
      expect(await screen.findByLabelText(i18n.t('mini.worldLabel', { world }))).toBeTruthy();
    }
    // The screen shows the name; the spoken greeting is a recording without it.
    expect(screen.getByText('Merhaba Deniz! Hangi dünyaya gidelim?')).toBeTruthy();
    expect(spoken()).toContain('Merhaba! Hangi dünyaya gidelim?');
  });

  it('opens a world and says the instruction, then the English word', async () => {
    startTestTrial();
    seedMini();
    await renderRouter(ROUTES, { initialUrl: '/' });
    await press(i18n.t('mini.worldLabel', { world: i18n.t('mini.worlds.animals') }));
    expect(spoken()).toContain('Hangisi?');
    const word = lastSpoken();
    expect(screen.getByLabelText(labelOf(word))).toBeTruthy();
    expect(screen.queryByLabelText(i18n.t('mini.next'))).toBeNull();
  });

  it('a wrong picture asks again without ending anything; the right one moves on', async () => {
    startTestTrial();
    seedMini();
    await renderRouter(ROUTES, { initialUrl: '/play/mini?world=food' });
    const right = labelOf(lastSpoken());
    const wrong = screen
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel as string | undefined)
      .find((l) => l && l !== right && l !== i18n.t('mini.exit') && l !== i18n.t('mini.replay'))!;
    await press(wrong);
    expect(lastSpoken()).not.toBe('Aferin!');
    expect(spoken()).toContain('Hadi bir daha!');
    expect(screen.queryByLabelText(i18n.t('mini.next'))).toBeNull();
    await press(right);
    expect(spoken()).toContain('Aferin!');
    expect(screen.getByLabelText(i18n.t('mini.next'))).toBeTruthy();
  });

  it('plays a whole session: words go into the deck, the session counts', async () => {
    startTestTrial();
    const id = seedMini();
    await renderRouter(ROUTES, { initialUrl: '/play/mini?world=animals' });
    for (let i = 0; i < 8; i++) await playActivity();
    expect(await screen.findByText(i18n.t('mini.done'))).toBeTruthy();
    expect(spoken()).toContain(i18n.t('mini.done'));
    expect(loadProgress(id).stats.sessions).toBe(1);
    expect(Object.keys(loadDeck(id, 'tr-en')).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(i18n.t('mini.again'))).toBeTruthy();
  });

  it('the first session is free; then a grown-up sees the plans', async () => {
    clearTestAccess();
    seedMini();
    await renderRouter(ROUTES, { initialUrl: '/' });
    await press(i18n.t('mini.worldLabel', { world: i18n.t('mini.worlds.nature') }));
    for (let i = 0; i < 8; i++) await playActivity();
    expect(await screen.findByLabelText(i18n.t('lock.parent'))).toBeTruthy();
    expect(screen.queryByLabelText(i18n.t('mini.again'))).toBeNull();
    await press(i18n.t('mini.home'));
    expect(await screen.findByText(i18n.t('lock.notStartedTitle'))).toBeTruthy();
  });

  it('one tap on exit does nothing; holding it goes home', async () => {
    startTestTrial();
    seedMini();
    await renderRouter(ROUTES, { initialUrl: '/play/mini?world=home' });
    const exit = screen.getByLabelText(i18n.t('mini.exit'));
    await fireEvent.press(exit);
    expect(screen.getByLabelText(i18n.t('mini.replay'))).toBeTruthy();
    await act(async () => {
      fireEvent(exit, 'longPress');
    });
    expect(
      await screen.findByLabelText(
        i18n.t('mini.worldLabel', { world: i18n.t('mini.worlds.home') }),
      ),
    ).toBeTruthy();
  });

  it('a finished session sticks new stickers in the album and shows them', async () => {
    startTestTrial();
    const id = seedMini();
    await renderRouter(ROUTES, { initialUrl: '/play/mini?world=food' });
    for (let i = 0; i < 8; i++) await playActivity();
    const owned = Object.keys(loadAlbum(id).owned);
    // Every activity was answered right the first time: two stickers plus one.
    expect(owned).toHaveLength(3);
    expect(screen.getByText('3 yeni çıkartma!')).toBeTruthy();
    const tr = content.languages.tr.words;
    for (const concept of owned) expect(screen.getByLabelText(tr[concept].text)).toBeTruthy();
    expect(spoken()).toContain('3 yeni çıkartma!');
  });

  it('the album opens from home on the first page with stickers; a sticker says its word', async () => {
    startTestTrial();
    const id = seedMini();
    saveAlbum(id, { owned: { 'animal.cat': 1, 'animal.dog': 1 } });
    await renderRouter(ROUTES, { initialUrl: '/' });
    await press(i18n.t('mini.album'));
    expect(spoken()).toContain(i18n.t('mini.albumHello'));
    const tr = content.languages.tr.words;
    expect(screen.getByLabelText(tr['animal.cat'].text)).toBeTruthy();
    expect(screen.getAllByLabelText(i18n.t('mini.emptySlot'))).toHaveLength(48);
    await press(tr['animal.dog'].text);
    expect(lastSpoken()).toBe(content.languages.en.words['animal.dog'].text);

    await press(i18n.t('mini.pageLabel', { world: i18n.t('mini.worlds.food'), count: 0 }));
    expect(screen.getAllByLabelText(i18n.t('mini.emptySlot'))).toHaveLength(50);
  });

  it('a full page cheers', async () => {
    startTestTrial();
    const id = seedMini();
    const unit = content.courses[0].units.find((u) => u.id === 'mini.nature')!;
    saveAlbum(id, { owned: Object.fromEntries(unit.concepts.map((c) => [c, 1])) });
    await renderRouter(ROUTES, { initialUrl: '/album?world=nature' });
    expect(screen.getByText(i18n.t('mini.pageFull'))).toBeTruthy();
    expect(screen.queryByLabelText(i18n.t('mini.emptySlot'))).toBeNull();
  });
});
