import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CHARACTERS, type CharacterId, type Expression } from '@/components/art/characters';
import { BlockProgress } from '@/components/BlockProgress';
import { Confetti } from '@/components/Confetti';
import { DraggableBlock, measureView, type Measurable } from '@/components/DraggableBlock';
import { GemCount } from '@/components/GameChrome';
import {
  Basket,
  HoldToExit,
  MemoryCardView,
  PictureCard,
  Sticker,
} from '@/components/mini/MiniParts';
import { Bounce, Shake } from '@/components/Motion';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { content } from '@/content/bundle';
import { getEntry } from '@/content';
import {
  buildMiniSession,
  choiceGrade,
  closeOpen,
  findWorld,
  flipCard,
  isFaceUp,
  isMemoryDone,
  miniCanStart,
  pickChoice,
  showHint,
  START_CHOICE,
  startMemory,
  type ChoiceState,
  type MemoryState,
  type MiniActivity,
  awardStickers,
  sessionWords,
} from '@/features/games/mini';
import { findCourse, isLanguageCode, type CourseId, type LanguageCode } from '@/features/languages';
import { useActiveProfile } from '@/features/profiles';
import { completeSession, type SessionReward } from '@/features/progress';
import { seededRng } from '@/features/quiz/rng';
import { learnedCount, localDay, recordAnswer, type Grade } from '@/features/srs';
import { playFeedback } from '@/lib/feedback';
import { comboEvent, trailingRun } from '@/lib/feedbackEvents';
import { speakSequence, stopSpeaking } from '@/lib/speech';
import { useAccess } from '@/lib/useAccess';
import { loadProgress, saveProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';
import { loadAlbum, saveAlbum } from '@/storage/stickers';
import { space, useTheme } from '@/theme';

/** How long a non-matching memory pair stays face up before turning back. */
const MISMATCH_MS = 1000;

function memoryFor(activity: MiniActivity | undefined): MemoryState | null {
  return activity?.kind === 'memory' ? startMemory(activity.pairs, seededRng(Date.now())) : null;
}

/** A session of picture games in one world, for ages 2–7 (LNG-33). */
export default function MiniGameScreen() {
  const profile = useActiveProfile();
  const { world: worldId } = useLocalSearchParams<{ world?: string }>();
  const [round, setRound] = useState(0);
  const world = worldId ? findWorld(content, profile?.courseId ?? 'tr-en', worldId) : undefined;

  if (!profile || profile.type !== 'mini' || !world) return <Redirect href="/" />;
  return (
    <Session
      key={round}
      profileId={profile.id}
      courseId={profile.courseId}
      worldId={world.id}
      onPlayAgain={() => setRound((r) => r + 1)}
    />
  );
}

type SessionProps = {
  profileId: string;
  courseId: CourseId;
  worldId: string;
  onPlayAgain: () => void;
};

function Session({ profileId, courseId, worldId, onPlayAgain }: SessionProps) {
  const { t, i18n } = useTranslation();
  const course = findCourse(courseId)!;
  // Instructions in the language the app is shown in; words in the target language.
  const uiLang: LanguageCode = isLanguageCode(i18n.language) ? i18n.language : course.nativeLang;
  const [today] = useState(() => localDay(new Date()));
  const [activities] = useState<MiniActivity[]>(() =>
    buildMiniSession({
      world: findWorld(content, courseId, worldId)!,
      deck: loadDeck(profileId, courseId),
      today,
      rng: seededRng(Date.now()),
    }),
  );
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<ChoiceState>(START_CHOICE);
  const [memory, setMemory] = useState<MemoryState | null>(() => memoryFor(activities[0]));
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gems, setGems] = useState(() => loadProgress(profileId).gems);
  const [reward, setReward] = useState<SessionReward | null>(null);
  const [stickers, setStickers] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const access = useAccess();

  const activity = activities[index];
  const word = (id: string) => getEntry(content, course.targetLang, id)?.text ?? '';
  const label = (id: string) => getEntry(content, course.nativeLang, id)?.text ?? word(id);
  const image = (id: string) => content.concepts.find((c) => c.id === id)?.image;

  const ask = (a: MiniActivity | undefined) => {
    if (!a) return;
    if (a.kind === 'memory') {
      speakSequence([{ text: t('mini.memory'), language: uiLang }]);
    } else {
      speakSequence([
        { text: t(a.kind === 'listen' ? 'mini.listen' : 'mini.basket'), language: uiLang },
        { text: word(a.target), language: course.targetLang },
      ]);
    }
  };

  // Each activity is spoken when it comes up (the children cannot read yet).
  useEffect(() => {
    ask(activity);
    return stopSpeaking;
    // Only when a new activity starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // A non-matching memory pair turns back after a moment.
  useEffect(() => {
    if (!memory || memory.open.length < 2) return;
    const timer = setTimeout(() => setMemory((m) => (m ? closeOpen(m) : m)), MISMATCH_MS);
    return () => clearTimeout(timer);
  }, [memory]);

  if (reward) {
    const sessions = loadProgress(profileId).stats.sessions;
    return (
      <Summary
        reward={reward}
        stickers={stickers}
        sayWords={(ids) => ids.map((id) => ({ text: word(id), language: course.targetLang }))}
        label={label}
        image={image}
        needsAccess={!miniCanStart(access, sessions)}
        onPlayAgain={onPlayAgain}
        uiLang={uiLang}
      />
    );
  }
  if (!activity) return <Redirect href="/" />;

  const answer = (picked: string) => {
    if (activity.kind === 'memory') return;
    const { state, right } = pickChoice(choice, activity.target, picked);
    setChoice(state);
    if (right) {
      const grade = choiceGrade(state);
      const next = [...grades, grade];
      setGrades(next);
      saveDeck(
        profileId,
        courseId,
        recordAnswer(loadDeck(profileId, courseId), activity.target, grade, today),
      );
      if (grade === 'good') setGems((g) => g + 1);
      const combo = grade === 'good' ? comboEvent(trailingRun(next)) : null;
      playFeedback(combo ?? 'correct');
      speakSequence([
        { text: t('mini.right'), language: uiLang },
        { text: word(activity.target), language: course.targetLang },
      ]);
    } else if (!choice.wrong.includes(picked)) {
      setMisses((m) => m + 1);
      playFeedback('wrong');
      // Kerem encourages, then the word is said again.
      speakSequence([
        { text: t('mini.tryAgain'), language: uiLang },
        { text: word(activity.target), language: course.targetLang },
      ]);
    }
  };

  const flip = (i: number) => {
    if (!memory) return;
    const { state, result } = flipCard(memory, i);
    setMemory(state);
    if (result === 'ignored') return;
    speakSequence([{ text: word(state.cards[i].conceptId), language: course.targetLang }]);
    if (result === 'match') playFeedback(isMemoryDone(state) ? 'combo3' : 'correct');
  };

  const done = activity.kind === 'memory' ? !!memory && isMemoryDone(memory) : choice.solved;

  const next = () => {
    if (index + 1 < activities.length) {
      setIndex(index + 1);
      setChoice(START_CHOICE);
      setMemory(memoryFor(activities[index + 1]));
      setMisses(0);
      return;
    }
    // Rewards only for a finished session; no level-up for ages 2–7.
    const deck = loadDeck(profileId, courseId);
    const result = completeSession(loadProgress(profileId), {
      grades,
      today,
      wordsLearned: learnedCount(deck),
    });
    saveProgress(profileId, result.progress);
    // New stickers for the album (LNG-34): the words just played come first.
    const award = awardStickers({
      album: loadAlbum(profileId),
      world: findWorld(content, courseId, worldId)!,
      sessionWords: sessionWords(activities),
      perfect: result.reward.perfect,
      today,
      rng: seededRng(Date.now()),
    });
    saveAlbum(profileId, award.album);
    setStickers(award.added);
    setReward(result.reward);
  };

  const speaker: CharacterId = done ? 'nehir' : misses > 0 ? 'kerem' : 'zeynep';
  const expression: Expression = done ? 'happy' : 'talking';

  return (
    <Screen
      footer={
        done ? (
          <PrimaryButton label={t('mini.next')} onPress={next} />
        ) : (
          <SecondaryButton label={t('mini.replay')} onPress={() => ask(activity)} />
        )
      }
    >
      <View style={styles.header}>
        <HoldToExit onExit={() => router.replace('/')} />
        <BlockProgress
          answered={index + (done ? 1 : 0)}
          blockSize={activities.length}
          blocks={1}
          label={t('mini.progress', { current: index + 1, total: activities.length })}
        />
        <GemCount gems={gems} />
      </View>
      <Speaker id={speaker} expression={expression} />
      {activity.kind === 'listen' ? (
        <Pictures
          options={activity.options}
          target={activity.target}
          choice={choice}
          label={label}
          image={image}
          onPick={answer}
        />
      ) : activity.kind === 'basket' ? (
        <BasketGame
          options={activity.options}
          target={activity.target}
          choice={choice}
          label={label}
          image={image}
          onPick={answer}
        />
      ) : memory ? (
        <Memory memory={memory} label={label} image={image} onFlip={flip} />
      ) : null}
    </Screen>
  );
}

/** The character speaking right now: Zeynep asks, Kerem encourages, Nehir cheers. */
function Speaker({ id, expression }: { id: CharacterId; expression: Expression }) {
  const { Component } = CHARACTERS[id];
  return (
    <View style={styles.speaker}>
      <Bounce trigger={expression === 'happy'}>
        <Component size={120} framing="portrait" expression={expression} />
      </Bounce>
    </View>
  );
}

type ChoiceProps = {
  options: string[];
  target: string;
  choice: ChoiceState;
  label: (id: string) => string;
  image: (id: string) => string | undefined;
  onPick: (id: string) => void;
};

function pictureState(id: string, target: string, choice: ChoiceState) {
  if (choice.solved && id === target) return 'right' as const;
  if (choice.wrong.includes(id)) return 'wrong' as const;
  if (showHint(choice) && id === target) return 'hint' as const;
  return 'idle' as const;
}

/** Hear a word, tap its picture: four big cards in two rows. */
function Pictures({ options, target, choice, label, image, onPick }: ChoiceProps) {
  const { width } = useWindowDimensions();
  const size = Math.min((width - space.xl * 2 - space.lg) / 2, 200);
  return (
    <View style={styles.grid}>
      {options.map((id) => (
        <Shake key={id} trigger={choice.wrong.includes(id) ? choice.wrong.indexOf(id) + 1 : 0}>
          <Bounce trigger={choice.solved && id === target}>
            <PictureCard
              image={image(id)}
              label={label(id)}
              size={size}
              state={pictureState(id, target, choice)}
              disabled={choice.solved}
              onPress={() => onPick(id)}
            />
          </Bounce>
        </Shake>
      ))}
    </View>
  );
}

/** Hear a word, drag (or tap) its picture into the basket. */
function BasketGame({ options, target, choice, label, image, onPick }: ChoiceProps) {
  const { width } = useWindowDimensions();
  const basketRef = useRef<Measurable | null>(null);
  const size = Math.min((width - space.xl * 2 - space.md * 2) / 3, 130);
  return (
    <View style={styles.basketGame}>
      <View style={styles.row}>
        {options.map((id) =>
          choice.solved && id === target ? (
            <View key={id} style={{ width: size, height: size }} />
          ) : (
            <Shake key={id} trigger={choice.wrong.includes(id) ? choice.wrong.indexOf(id) + 1 : 0}>
              <DraggableBlock
                measureZone={(cb) => measureView(basketRef.current, cb)}
                onDrop={() => onPick(id)}
                disabled={choice.solved}
              >
                <PictureCard
                  image={image(id)}
                  label={label(id)}
                  size={size}
                  state={pictureState(id, target, choice)}
                  disabled={choice.solved}
                  onPress={() => onPick(id)}
                />
              </DraggableBlock>
            </Shake>
          ),
        )}
      </View>
      <View
        ref={(view) => {
          basketRef.current = view as unknown as Measurable | null;
        }}
        style={styles.basket}
      >
        <Bounce trigger={choice.solved}>
          <Basket size={Math.min(width - space.xl * 2, 260)}>
            {choice.solved ? (
              <PictureCard
                image={image(target)}
                label={label(target)}
                size={size}
                state="right"
                disabled
                onPress={() => undefined}
              />
            ) : null}
          </Basket>
        </Bounce>
      </View>
    </View>
  );
}

type MemoryProps = {
  memory: MemoryState;
  label: (id: string) => string;
  image: (id: string) => string | undefined;
  onFlip: (index: number) => void;
};

/** Six cards in two rows of three; find the three pairs. */
function Memory({ memory, label, image, onFlip }: MemoryProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const size = Math.min((width - space.xl * 2 - space.md * 2) / 3, 130);
  return (
    <View style={styles.memory}>
      {memory.cards.map((card, i) => {
        const up = isFaceUp(memory, i);
        return (
          <MemoryCardView
            key={i}
            image={image(card.conceptId)}
            faceUp={up}
            matched={memory.matched.includes(i)}
            label={up ? label(card.conceptId) : t('mini.cardBack', { n: i + 1 })}
            size={size}
            onPress={() => onFlip(i)}
          />
        );
      })}
    </View>
  );
}

type SummaryProps = {
  reward: SessionReward;
  /** Stickers just earned (concept ids). */
  stickers: string[];
  sayWords: (ids: string[]) => { text: string; language: LanguageCode }[];
  label: (id: string) => string;
  image: (id: string) => string | undefined;
  needsAccess: boolean;
  uiLang: LanguageCode;
  onPlayAgain: () => void;
};

/** All three characters cheer; "see you tomorrow" without pushing (kids-ux). */
function Summary({
  reward,
  stickers,
  sayWords,
  label,
  image,
  needsAccess,
  uiLang,
  onPlayAgain,
}: SummaryProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [said] = useState(() => [
    { text: t('mini.done'), language: uiLang },
    ...(stickers.length > 0
      ? [{ text: t('mini.newStickers', { count: stickers.length }), language: uiLang }]
      : []),
    ...sayWords(stickers),
  ]);
  useEffect(() => {
    playFeedback('complete');
    speakSequence(said);
    return stopSpeaking;
  }, [said]);
  const size = Math.min((width - space.xl * 2 - space.md * 2) / 3, 120);
  return (
    <>
      <Screen
        footer={
          <View style={styles.footer}>
            {needsAccess ? (
              // The first session is free; then a grown-up sees the plans (behind the gate).
              <PrimaryButton label={t('lock.parent')} onPress={() => router.replace('/paywall')} />
            ) : (
              <PrimaryButton label={t('mini.again')} onPress={onPlayAgain} />
            )}
            <SecondaryButton label={t('mini.home')} onPress={() => router.replace('/')} />
          </View>
        }
      >
        <View style={styles.cheer}>
          {(['zeynep', 'nehir', 'kerem'] as const).map((id) => {
            const { Component } = CHARACTERS[id];
            return <Component key={id} size={150} expression="happy" />;
          })}
        </View>
        <ThemedText variant="title" accessibilityRole="header" style={styles.center}>
          {t('mini.done')}
        </ThemedText>
        {stickers.length > 0 ? (
          <View style={styles.stickers}>
            <ThemedText color="textMuted" style={styles.center}>
              {t('mini.newStickers', { count: stickers.length })}
            </ThemedText>
            <View style={styles.row}>
              {stickers.map((id, i) => (
                <Bounce key={id} trigger={i + 1}>
                  <Sticker image={image(id)} label={label(id)} size={size} />
                </Bounce>
              ))}
            </View>
          </View>
        ) : null}
        <View style={[styles.gems, { borderColor: colors.border }]}>
          <GemCount gems={reward.gems} />
        </View>
      </Screen>
      {reward.perfect ? <Confetti /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  speaker: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.lg,
  },
  basketGame: {
    gap: space.xxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.md,
  },
  basket: {
    alignItems: 'center',
  },
  memory: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.md,
  },
  footer: {
    gap: space.md,
  },
  cheer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  center: {
    textAlign: 'center',
  },
  stickers: {
    gap: space.sm,
  },
  gems: {
    alignItems: 'center',
  },
});
