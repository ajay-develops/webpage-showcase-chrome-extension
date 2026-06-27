import { describe, expect, it } from 'vitest';
import {
  easeInOutCubic,
  getSectionScrollDuration,
} from './showcase-engine';

describe('easeInOutCubic', () => {
  it('returns 0 at t=0 and 1 at t=1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('is monotonically increasing from 0 to 1', () => {
    let prev = easeInOutCubic(0);
    for (let i = 1; i <= 100; i++) {
      const t = i / 100;
      const value = easeInOutCubic(t);
      expect(value).toBeGreaterThanOrEqual(prev);
      prev = value;
    }
  });

  it('equals 0.5 at midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
  });
});

describe('getSectionScrollDuration', () => {
  const minMs = 2500;
  const maxMs = 14000;
  const pps = 150;

  it('returns minMs when distance <= 1', () => {
    expect(getSectionScrollDuration(100, 100, pps, minMs, maxMs)).toBe(minMs);
    expect(getSectionScrollDuration(100, 100.5, pps, minMs, maxMs)).toBe(minMs);
  });

  it('scales duration with distance', () => {
    const duration = getSectionScrollDuration(0, 1500, pps, minMs, maxMs);
    expect(duration).toBe(10000);
  });

  it('caps at maxMs for very long sections', () => {
    const duration = getSectionScrollDuration(0, 100000, pps, minMs, maxMs);
    expect(duration).toBe(maxMs);
  });

  it('floors at minMs for short scroll distances', () => {
    const duration = getSectionScrollDuration(0, 100, pps, minMs, maxMs);
    expect(duration).toBe(minMs);
  });
});
