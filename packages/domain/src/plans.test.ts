import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN_ID, listPlans, PLANS } from './plans.js';

describe('commercial plans catalog', () => {
  it('exposes free, pro, and agency', () => {
    expect(listPlans().map((plan) => plan.id)).toEqual(['free', 'pro', 'agency']);
    expect(DEFAULT_PLAN_ID).toBe('free');
    expect(PLANS.agency.whiteLabel).toBe(true);
  });
});
