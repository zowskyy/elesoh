export type PlanId = 'free' | 'pro' | 'agency';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  auditsPerMonth: number;
  discoveryEnabled: boolean;
  whiteLabel: boolean;
  apiKeys: boolean;
  priceLabel: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    auditsPerMonth: 3,
    discoveryEnabled: false,
    whiteLabel: false,
    apiKeys: false,
    priceLabel: '$0',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    auditsPerMonth: 100,
    discoveryEnabled: true,
    whiteLabel: false,
    apiKeys: true,
    priceLabel: '$49/mo',
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    auditsPerMonth: 1000,
    discoveryEnabled: true,
    whiteLabel: true,
    apiKeys: true,
    priceLabel: '$199/mo',
  },
};

export const DEFAULT_PLAN_ID: PlanId = 'free';

export function listPlans(): PlanDefinition[] {
  return [PLANS.free, PLANS.pro, PLANS.agency];
}
