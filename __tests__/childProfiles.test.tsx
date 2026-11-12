import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import NewChildScreen from '@/app/child-new';
import HomeScreen from '@/app/index';
import SelfAssessmentScreen from '@/app/onboarding/level';
import ParentGateScreen from '@/app/parent-gate';
import SettingsScreen from '@/app/settings';
import WhoIsPlayingScreen from '@/app/who';
import { closeGate, markGatePassed } from '@/features/parental-gate';
import {
  addProfile,
  deleteProfile,
  getActiveProfile,
  profilesStore,
  resetProfileChoice,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

const ROUTES = {
  index: HomeScreen,
  'parent-gate': ParentGateScreen,
  settings: SettingsScreen,
  'child-new': NewChildScreen,
  who: WhoIsPlayingScreen,
  'onboarding/level': SelfAssessmentScreen,
};

function seed(nickname: string, type: ProfileType, level?: string) {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname, type, courseId: 'tr-en' }, d, { activate: false }),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.profiles.at(-1)!.id;
  if (level) profilesStore.update((s) => setCourseLevel(s, id, level));
  return id;
}

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByLabelText(label));
}

async function addChild(age: RegExp, nickname: string) {
  await renderRouter(ROUTES, { initialUrl: '/settings' });
  await press('Çocuğum için profil oluştur');
  await press(age);
  await fireEvent.changeText(screen.getByLabelText('Takma ad'), nickname);
  await press('Profili oluştur');
}

const active = () => getActiveProfile(profilesStore.getState());

describe('child profiles', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    resetProfileChoice();
    markGatePassed();
  });

  afterEach(() => {
    closeGate();
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('adds a 7–12 child and stays on the parent profile', async () => {
    seed('Furkan', 'adult', 'A1');
    await addChild(/^7–12 yaş/, 'Deniz');
    expect(screen.getByText('Deniz hazır!')).toBeTruthy();
    expect(profilesStore.getState().profiles.map((p) => [p.nickname, p.type])).toEqual([
      ['Furkan', 'adult'],
      ['Deniz', 'kid'],
    ]);
    expect(active()?.nickname).toBe('Furkan');

    await press('Ayarlara dön');
    expect(screen.getByText('Deniz')).toBeTruthy();
  });

  it('hands over to a new 7–12 child, who starts with self-assessment', async () => {
    seed('Furkan', 'adult', 'A1');
    await addChild(/^7–12 yaş/, 'Deniz');
    await press('Şimdi Deniz ile oyna');
    expect(active()?.nickname).toBe('Deniz');
    expect(screen.getByText('Ne kadar İngilizce biliyorsun?')).toBeTruthy();
  });

  it('offers only the two child age groups', async () => {
    seed('Furkan', 'adult', 'A1');
    await renderRouter(ROUTES, { initialUrl: '/child-new' });
    expect(screen.getByLabelText(/^2–7 yaş/)).toBeTruthy();
    expect(screen.getByLabelText(/^7–12 yaş/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Yetişkin/)).toBeNull();
  });

  it('refuses a nickname already in the family', async () => {
    seed('Furkan', 'adult', 'A1');
    await addChild(/^2–7 yaş/, 'furkan');
    expect(screen.getByText('Bu takma ad kullanılıyor, başka bir tane dene.')).toBeTruthy();
    expect(profilesStore.getState().profiles).toHaveLength(1);
  });

  it('cannot be reached without the parental gate', async () => {
    seed('Furkan', 'adult', 'A1');
    closeGate();
    await renderRouter(ROUTES, { initialUrl: '/child-new' });
    expect(screen.getByText('Ebeveyn kontrolü')).toBeTruthy();
  });

  it('stops offering new profiles at the family limit', async () => {
    seed('Furkan', 'adult', 'A1');
    seed('Deniz', 'kid', 'L1');
    seed('Ece', 'mini');
    await renderRouter(ROUTES, { initialUrl: '/settings' });
    expect(screen.queryByLabelText('Çocuğum için profil oluştur')).toBeNull();
    expect(screen.getByText('En fazla 3 profil oluşturulabilir.')).toBeTruthy();
  });
});

describe("who's playing", () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    resetProfileChoice();
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('asks on launch when there are several profiles, then plays as the pick', async () => {
    seed('Furkan', 'adult', 'A1');
    seed('Ece', 'mini');
    await renderRouter(ROUTES);
    expect(screen.getByText('Kim oynuyor?')).toBeTruthy();
    await press('Ece');
    expect(active()?.nickname).toBe('Ece');
    expect(screen.getByText(/^Merhaba Ece/)).toBeTruthy();
  });

  it('does not ask with a single profile', async () => {
    seed('Furkan', 'adult', 'A1');
    await renderRouter(ROUTES);
    expect(screen.queryByText('Kim oynuyor?')).toBeNull();
    expect(screen.queryByLabelText('Profil değiştir')).toBeNull();
  });

  it('switches profiles from settings, not from the home screen', async () => {
    seed('Furkan', 'adult', 'A1');
    seed('Ece', 'mini');
    await renderRouter(ROUTES);
    await press('Furkan');
    expect(screen.queryByLabelText('Profil değiştir')).toBeNull();

    markGatePassed();
    await renderRouter(ROUTES, { initialUrl: '/settings' });
    await press('Profil değiştir');
    expect(screen.getByText('Kim oynuyor?')).toBeTruthy();
    await press('Ece');
    expect(active()?.nickname).toBe('Ece');
  });
});
