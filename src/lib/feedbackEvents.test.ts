import { comboEvent, FEEDBACK_EVENTS, HAPTIC_FOR, trailingRun } from './feedbackEvents';

describe('feedback events', () => {
  it('has a haptic for every event', () => {
    for (const e of FEEDBACK_EVENTS) expect(HAPTIC_FOR[e]).toBeDefined();
  });

  it('counts the run of right answers at the end', () => {
    expect(trailingRun([])).toBe(0);
    expect(trailingRun(['good', 'again', 'good', 'good'])).toBe(2);
    expect(trailingRun(['good', 'good', 'hard'])).toBe(0);
  });

  it('marks combos at exactly 3, 5 and 10', () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10, 11].map(comboEvent)).toEqual([
      null,
      null,
      'combo3',
      null,
      'combo5',
      null,
      null,
      'combo10',
      null,
    ]);
  });
});
