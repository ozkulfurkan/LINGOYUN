import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import AgeGroupScreen from '@/app/onboarding/age';
import NicknameScreen from '@/app/onboarding/index';
import SelfAssessmentScreen from '@/app/onboarding/level';
import PlacementScreen from '@/app/placement/index';
import { addProfile, deleteProfile, profilesStore, type ProfileType } from '@/features/profiles';
import i18n from '@/i18n';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));

const ROUTES = {
  index: HomeScreen,
  'onboarding/index': NicknameScreen,
  'onboarding/age': AgeGroupScreen,
  'onboarding/level': SelfAssessmentScreen,
  'placement/index': PlacementScreen,
};

const activeProfile = () => {
  const { profiles, activeId } = profilesStore.getState();
  return profiles.find((p) => p.id === activeId);
};

const levelOf = () => {
  const profile = activeProfile();
  return profile?.courses[profile.courseId]?.level;
};

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByLabelText(label));
}

async function createProfile(nickname: string) {
  await fireEvent.changeText(screen.getByLabelText('Takma ad'), nickname);
  await press('Devam');
}

function seedProfile(type: ProfileType) {
  const result = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!result.ok) throw new Error(result.error);
}

describe('onboarding', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('opens on the nickname screen when there is no profile', async () => {
    await renderRouter(ROUTES);
    expect(screen.getByText('Kim öğrenecek?')).toBeTruthy();
  });

  it('refuses an empty nickname and stays on the screen', async () => {
    await renderRouter(ROUTES);
    await createProfile('   ');
    expect(screen.getByText('Önce bir takma ad yaz.')).toBeTruthy();
    expect(screen.getByText('Kim öğrenecek?')).toBeTruthy();
    expect(profilesStore.getState().profiles).toHaveLength(0);
  });

  it('clears the error once the nickname changes', async () => {
    await renderRouter(ROUTES);
    await createProfile('');
    await fireEvent.changeText(screen.getByLabelText('Takma ad'), 'D');
    expect(screen.queryByText('Önce bir takma ad yaz.')).toBeNull();
  });

  it('creates nothing until an age group is confirmed', async () => {
    await renderRouter(ROUTES);
    await createProfile('Deniz');
    expect(screen.getByText('Deniz için hangisi?')).toBeTruthy();
    expect(screen.queryByLabelText('Devam')).toBeNull();

    await press(/^2–7 yaş/);
    expect(screen.getByLabelText(/^2–7 yaş/).props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(profilesStore.getState().profiles).toHaveLength(0);
  });

  it('takes a mini profile straight home, with no level', async () => {
    await renderRouter(ROUTES);
    await createProfile(' Deniz ');
    await press(/^2–7 yaş/);
    await press('Devam');

    expect(activeProfile()).toMatchObject({ nickname: 'Deniz', type: 'mini', courseId: 'tr-en' });
    expect(levelOf()).toBeNull();
    expect(screen.getByText(/^Merhaba Deniz/)).toBeTruthy();
  });

  it.each([
    [/^7–12 yaş/, 'Çok iyi biliyorum', 'kid'],
    [/^Yetişkin/, 'Rahatça konuşabiliyorum', 'adult'],
  ])('%s goes through self-assessment into the test', async (ageLabel, answer, type) => {
    await renderRouter(ROUTES);
    await createProfile('Deniz');
    await press(ageLabel);
    await press('Devam');

    expect(screen.getByText('Ne kadar İngilizce biliyorsun?')).toBeTruthy();
    expect(activeProfile()?.type).toBe(type);
    expect(screen.queryByLabelText('Devam')).toBeNull();

    await press(answer);
    await press('Devam');

    expect(screen.getByLabelText('Bilmiyorum')).toBeTruthy();
    expect(levelOf()).toBeNull();
  });

  it('resumes at self-assessment if the app closed before it', async () => {
    seedProfile('kid');
    await renderRouter(ROUTES);
    expect(screen.getByText('Ne kadar İngilizce biliyorsun?')).toBeTruthy();
  });

  it('opens home directly once setup is done', async () => {
    seedProfile('mini');
    await renderRouter(ROUTES);
    expect(screen.getByText(/^Merhaba Deniz/)).toBeTruthy();
  });

  it('uses the interface language', async () => {
    await i18n.changeLanguage('en');
    await renderRouter(ROUTES);
    expect(screen.getByText('Who is learning?')).toBeTruthy();
  });
});
