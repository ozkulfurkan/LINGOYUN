import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import ParentGateScreen from '@/app/parent-gate';
import SettingsScreen from '@/app/settings';
import { closeGate } from '@/features/parental-gate';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';
import tr from '@/i18n/tr.json';
import { loadSettings } from '@/storage/settings';
import { storage } from '@/storage/storage';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

const ROUTES = { index: HomeScreen, 'parent-gate': ParentGateScreen, settings: SettingsScreen };

function seed(nickname: string, type: ProfileType, level?: string): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname, type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  if (level) profilesStore.update((s) => setCourseLevel(s, id, level));
  return id;
}

const NUMBER: Record<string, number> = Object.fromEntries(
  Object.entries(tr.gate.numbers).map(([n, word]) => [word, Number(n)]),
);

/** Reads "yedi çarpı sekiz" and returns 56. */
function gateAnswer(): number {
  const question = screen.getByTestId('gate-question').props.children as string;
  const [a, , b] = question.split(' ');
  return NUMBER[a] * NUMBER[b];
}

async function type(value: number) {
  for (const d of String(value)) await fireEvent.press(screen.getByLabelText(d));
}

async function openSettings() {
  await renderRouter(ROUTES);
  await fireEvent.press(screen.getByLabelText('Ayarlar (ebeveyn)'));
  await type(gateAnswer());
}

describe('parental gate and settings', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    storage.remove('settings.v1');
    closeGate();
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('asks a multiplication in words and opens settings on the right answer', async () => {
    seed('Deniz', 'kid', 'L1');
    await renderRouter(ROUTES);
    await fireEvent.press(screen.getByLabelText('Ayarlar (ebeveyn)'));
    expect(screen.getByText('Devam etmek için sonucu rakamla yaz:')).toBeTruthy();
    expect(screen.getByTestId('gate-question').props.children).toMatch(/^\S+ çarpı \S+$/);

    await type(gateAnswer());
    expect(screen.getByText('Ayarlar')).toBeTruthy();
  });

  it('gives a new question after a wrong answer', async () => {
    seed('Deniz', 'kid', 'L1');
    await renderRouter(ROUTES);
    await fireEvent.press(screen.getByLabelText('Ayarlar (ebeveyn)'));
    const right = gateAnswer();
    const wrong = right === 99 ? 98 : right + 1;
    await type(Number(String(wrong).slice(0, String(right).length)));
    expect(screen.getByText('Olmadı. Yeni bir soru geldi.')).toBeTruthy();
    expect(screen.queryByText('Ayarlar')).toBeNull();
    expect(gateAnswer()).not.toBe(right);
  });

  it('sends a direct visit to settings through the gate', async () => {
    seed('Deniz', 'kid', 'L1');
    await renderRouter(ROUTES, { initialUrl: '/settings' });
    expect(screen.getByText('Ebeveyn kontrolü')).toBeTruthy();
  });

  it('switches sound off', async () => {
    seed('Deniz', 'kid', 'L1');
    await openSettings();
    await fireEvent(screen.getByLabelText('Ses efektleri'), 'valueChange', false);
    expect(loadSettings()).toEqual({ sound: false, haptics: true });
  });

  it('switches and deletes profiles after a confirmation', async () => {
    const ece = seed('Ece', 'adult', 'A1');
    seed('Can', 'kid', 'L1');
    await openSettings();

    await fireEvent.press(screen.getByLabelText('Bu profile geç'));
    expect(profilesStore.getState().activeId).toBe(ece);

    await fireEvent.press(screen.getByLabelText('Sil: Can'));
    expect(screen.getByText('Can kalıcı olarak silinsin mi? İlerlemesi de silinir.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Vazgeç'));
    expect(profilesStore.getState().profiles).toHaveLength(2);

    await fireEvent.press(screen.getByLabelText('Sil: Can'));
    await fireEvent.press(screen.getByLabelText('Evet, sil'));
    expect(profilesStore.getState().profiles.map((p) => p.nickname)).toEqual(['Ece']);
  });

  it('is also reachable from the mini home screen', async () => {
    seed('Nehir', 'mini');
    await renderRouter(ROUTES);
    expect(screen.getByLabelText('Ayarlar (ebeveyn)')).toBeTruthy();
  });
});
