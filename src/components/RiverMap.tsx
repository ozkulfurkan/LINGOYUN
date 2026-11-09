import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { riverLayout, type LevelNode } from '@/features/map';
import { touchTarget, useTheme } from '@/theme';

const STEP = touchTarget.mini * 2;
const PADDING = touchTarget.mini;
const STOP = touchTarget.mini / 2; // radius of a level stone
const RING = STOP + 8;
/** Width used until the first layout pass reports the real one. */
const DEFAULT_WIDTH = 342;

type Props = {
  nodes: readonly LevelNode[];
  /** Short label inside a stone, e.g. "3" for kid level L3. */
  shortLabel: (level: string) => string;
};

/**
 * Levels as stones along a river winding down the screen: done ones ticked,
 * the current one large with a ring showing how much of it is learned, locked
 * ones faded. Drawn with react-native-svg (no extra native module).
 */
export function RiverMap({ nodes, shortLabel }: Props) {
  const { t } = useTranslation();
  const { colors, text } = useTheme();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const { points, path, height } = riverLayout(nodes.length, {
    width,
    step: STEP,
    padding: PADDING,
  });

  return (
    <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} style={{ height }}>
      <Svg width={width} height={height} accessible={false}>
        <Path
          d={path}
          stroke={colors.correct}
          strokeWidth={STOP * 1.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.35}
        />
        <Path
          d={path}
          stroke={colors.onSurfaceInverse}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="2 14"
          fill="none"
          opacity={0.6}
        />
        {nodes.map((node, i) => {
          const { x, y } = points[i];
          const current = node.state === 'current';
          const done = node.state === 'done';
          const empty = node.conceptCount === 0;
          const r = current ? STOP * 1.15 : STOP;
          const fill = done ? colors.correct : current ? colors.accent : colors.surfaceShade;
          const ink = done ? colors.onCorrect : current ? colors.onAccent : colors.textMuted;
          const circumference = 2 * Math.PI * RING;
          return (
            <G key={node.level}>
              {current ? (
                <>
                  <Circle
                    cx={x}
                    cy={y}
                    r={RING * 1.15}
                    stroke={colors.surfaceShade}
                    strokeWidth={6}
                    fill="none"
                  />
                  <Circle
                    cx={x}
                    cy={y}
                    r={RING * 1.15}
                    stroke={colors.reward}
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference * 1.15 * node.mastery} ${circumference * 1.15}`}
                    transform={`rotate(-90 ${x} ${y})`}
                  />
                </>
              ) : null}
              <Circle cx={x} cy={y + r * 0.18} r={r} fill={colors.text} opacity={0.12} />
              <Circle
                cx={x}
                cy={y}
                r={r}
                fill={fill}
                stroke={empty ? colors.border : 'none'}
                strokeDasharray={empty ? '6 6' : undefined}
                strokeWidth={empty ? 2 : 0}
              />
              <SvgText
                x={x}
                y={y + r * 0.35}
                fontFamily={text.title.fontFamily}
                fontSize={r * 0.9}
                textAnchor="middle"
                fill={ink}
              >
                {done ? '✓' : shortLabel(node.level)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {/* Invisible, positioned labels so screen readers can read every stop. */}
      {nodes.map((node, i) => (
        <View
          key={node.level}
          accessible
          accessibilityLabel={stopLabel(t, node)}
          style={[
            styles.label,
            {
              left: points[i].x - STOP,
              top: points[i].y - STOP,
              width: STOP * 2,
              height: STOP * 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

function stopLabel(t: T, node: LevelNode): string {
  if (node.conceptCount === 0) return t('map.soon', { level: node.level });
  if (node.state === 'done') return t('map.done', { level: node.level });
  if (node.state === 'locked') return t('map.locked', { level: node.level });
  return t('map.current', { level: node.level, percent: Math.round(node.mastery * 100) });
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
  },
});
