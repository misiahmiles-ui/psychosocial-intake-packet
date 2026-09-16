export const DEFAULT_ASSESSMENT_INCLUDED_QUANTITY = 30;
export const DEFAULT_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS = 30;
export const DEFAULT_ASSESSMENT_RECURRING_INCLUDED_QUANTITY = 30;

export const INITIAL_ASSESSMENT_ENTITLEMENT_LABEL =
  `${DEFAULT_ASSESSMENT_INCLUDED_QUANTITY} AI-Assisted Psychosocial Assessment Generations Included`;

export const INITIAL_ASSESSMENT_ENTITLEMENT_DETAIL =
  `Credits are granted once at purchase activation for a ${DEFAULT_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS}-day, non-rollover window.`;

export const RECURRING_ASSESSMENT_ENTITLEMENT_LABEL =
  `$10/month after the included period for ${DEFAULT_ASSESSMENT_RECURRING_INCLUDED_QUANTITY} successful assessment generations per paid Stripe billing cycle`;
