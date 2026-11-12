import { Redirect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CHARACTERS } from '@/components/art/characters';
import { WordPicture } from '@/components/art/words/WordPicture';
import { CloseButton } from '@/components/GameChrome';
import { Sticker, StickerSlot } from '@/components/mini/MiniParts';
import { PressScale } from '@/components/PressScale';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { getEntry } from '@/content';
import { content } from '@/content/bundle';
import {
  albumPage,
  isPageFull,
  miniWorlds,
  pageCount,
  type MiniWorld,
} from '@/features/games/mini';
import { findCourse, isLanguageCode } from '@/features/languages';
import { useActiveProfile } from '@/features/profiles';
import { speakSequence } from '@/lib/speech';
import { loadAlbum } from '@/storage/stickers';
import { space, stroke, touchTarget, useTheme } from '@/theme';

/** Stickers per row on a page. */
const PER_ROW = 4;

/** The sticker album of ages 2–7 (LNG-34): one page per world. */
export default function AlbumScreen() {
  const profile = useActiveProfile();
  const { world: start } = useLocalSearchParams<{ world?: string }>();
  if (!profile || profile.type !== 'mini') return <Redirect href="/" />;
  return <Album profileId={profile.id} courseId={profile.courseId} start={start} />;
}

function Album({
  profileId,
  courseId,
  start,
}: {
  profileId: string;
  courseId: Parameters<typeof miniWorlds>[1];
  start?: string;
}) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const course = findCourse(courseId)!;
  const uiLang = isLanguageCode(i18n.language) ? i18n.language : course.nativeLang;
  const worlds = miniWorlds(content, courseId);
  const [album] = useState(() => loadAlbum(profileId));
  // Opens on the asked page, else on the first page with a sticker.
  const [worldId, setWorldId] = useState(
    () =>
      worlds.find((w) => w.id === start)?.id ??
      worlds.find((w) => pageCount(album, w) > 0)?.id ??
      worlds[0]?.id,
  );
  const world = worlds.find((w) => w.id === worldId);

  const say = useCallback(
    (id: string) =>
      speakSequence([
        { text: getEntry(content, course.targetLang, id)?.text ?? '', language: course.targetLang },
      ]),
    [course.targetLang],
  );

  useEffect(() => {
    return speakSequence([{ text: t('mini.albumHello'), language: uiLang }]);
  }, [t, uiLang]);

  if (!world) return <Redirect href="/" />;
  const full = isPageFull(album, world);
  const size = Math.min((width - space.xl * 2 - space.md * (PER_ROW - 1)) / PER_ROW, 110);
  const worldName = (w: MiniWorld) => t(`mini.worlds.${w.id}` as 'mini.worlds.animals');

  return (
    <Screen>
      <View style={styles.header}>
        <CloseButton />
        <ThemedText variant="title" accessibilityRole="header" style={styles.grow}>
          {t('mini.album')}
        </ThemedText>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {worlds.map((w) => (
          <WorldTab
            key={w.id}
            world={w}
            selected={w.id === world.id}
            label={t('mini.pageLabel', { world: worldName(w), count: pageCount(album, w) })}
            onPress={() => {
              setWorldId(w.id);
              speakSequence([{ text: worldName(w), language: uiLang }]);
            }}
          />
        ))}
      </View>
      {full ? (
        <View style={styles.full}>
          <CHARACTERS.nehir.Component size={110} framing="portrait" expression="happy" />
          <ThemedText variant="option" color="accentText">
            {t('mini.pageFull')}
          </ThemedText>
        </View>
      ) : null}
      <View style={styles.page}>
        {albumPage(album, world).map((slot) => {
          const label = getEntry(content, course.nativeLang, slot.conceptId)?.text ?? '';
          const image = content.concepts.find((c) => c.id === slot.conceptId)?.image;
          return slot.owned ? (
            <Sticker
              key={slot.conceptId}
              image={image}
              label={label}
              size={size}
              onPress={() => say(slot.conceptId)}
            />
          ) : (
            <StickerSlot key={slot.conceptId} size={size} label={t('mini.emptySlot')} />
          );
        })}
      </View>
    </Screen>
  );
}

/** A page tab: the world's cover picture; the open page has a thick border. */
function WorldTab({
  world,
  selected,
  label,
  onPress,
}: {
  world: MiniWorld;
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors, radii } = useTheme();
  return (
    <PressScale
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tab,
        {
          backgroundColor: selected ? colors.highlight : colors.surface,
          borderColor: selected ? colors.accentText : colors.border,
          borderWidth: selected ? stroke.thick : stroke.thin,
          borderRadius: radii.md,
        },
      ]}
    >
      <WordPicture image={world.cover} size={touchTarget.mini * 0.8} />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  grow: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  tab: {
    width: touchTarget.mini,
    height: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
    alignItems: 'center',
    gap: space.sm,
  },
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.md,
  },
});
