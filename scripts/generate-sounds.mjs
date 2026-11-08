// Synthesizes the game's sound effects into assets/audio/sfx/*.wav.
// Deterministic and licence-free: run `node scripts/generate-sounds.mjs` to rebuild.
// Tones follow the game-feel skill: right = rising notes, wrong = soft and
// never punishing, bigger moments = longer, brighter arpeggios.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio', 'sfx');

const note = (n) => 440 * 2 ** ((n - 69) / 12); // MIDI number → Hz
const [C5, E5, G5, C6, E6, G6, C7] = [72, 76, 79, 84, 88, 91, 96].map(note);
const [F4, A4] = [65, 69].map(note);

/** One soft "clay" tone: sine with a little second harmonic, quick attack, smooth decay. */
function tone(freq, ms, { gain = 0.5, start = 0, bright = 0.25 } = {}) {
  return { freq, ms, gain, start, bright };
}

function render(tones) {
  const end = Math.max(...tones.map((t) => t.start + t.ms)) + 30;
  const samples = new Float32Array(Math.ceil((end / 1000) * RATE));
  for (const t of tones) {
    const from = Math.floor((t.start / 1000) * RATE);
    const n = Math.floor((t.ms / 1000) * RATE);
    const attack = Math.min(0.006 * RATE, n / 4);
    for (let i = 0; i < n; i++) {
      const x = i / RATE;
      const env = Math.min(1, i / attack) * Math.exp((-4 * i) / n);
      const wave =
        Math.sin(2 * Math.PI * t.freq * x) + t.bright * Math.sin(4 * Math.PI * t.freq * x);
      samples[from + i] += (t.gain * env * wave) / (1 + t.bright);
    }
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2),
  );
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const arpeggio = (notes, step, ms, gain) =>
  notes.map((f, i) => tone(f, ms, { start: i * step, gain }));

export const SOUNDS = {
  tap: [tone(C7, 35, { gain: 0.25, bright: 0.6 })],
  correct: [tone(C6, 110, { gain: 0.45 }), tone(E6, 160, { start: 90, gain: 0.45 })],
  // Soft, low and short: tells "not this one" without a buzzer.
  wrong: [
    tone(A4, 140, { gain: 0.35, bright: 0.05 }),
    tone(F4, 200, { start: 120, gain: 0.3, bright: 0.05 }),
  ],
  combo3: arpeggio([C6, E6, G6], 70, 120, 0.4),
  combo5: arpeggio([E6, G6, C7], 65, 130, 0.42),
  combo10: arpeggio([C6, E6, G6, C7], 60, 160, 0.45),
  complete: [
    ...arpeggio([C5, E5, G5, C6], 110, 220, 0.45),
    tone(C6, 420, { start: 440, gain: 0.3 }),
  ],
  levelUp: [
    ...arpeggio([C5, E5, G5], 90, 200, 0.4),
    tone(C6, 600, { start: 300, gain: 0.45 }),
    tone(E6, 600, { start: 300, gain: 0.3 }),
    tone(G6, 600, { start: 300, gain: 0.25 }),
  ],
};

mkdirSync(OUT, { recursive: true });
for (const [name, tones] of Object.entries(SOUNDS)) {
  const file = join(OUT, `${name}.wav`);
  writeFileSync(file, wav(render(tones)));
  console.log(`${name}.wav`);
}
