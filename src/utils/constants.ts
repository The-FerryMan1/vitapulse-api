/**
 * Application constants
 */

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_INPUT: 'Invalid input',
  NOT_FOUND: 'Resource not found',
  UNEXPECTED_ERROR: 'Unexpected error occurred',
} as const;

export const ABNORMAL_BP_STATUSES = [
  'Hypertensive Crisis',
  'Hypertension Stage 2',
  'Hypertension Stage 1',
  'Elevated',
  'Low',
  'Low BP (Hypotension)',
] as readonly string[];

export const ABNORMAL_PULSE_STATUSES = ['High', 'Low'] as readonly string[];

export const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export const TOKEN_EXPIRATION = {
  ACCESS: 5, // 5 minutes in seconds
  REFRESH: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

export const COOKIE_CONFIG = {
  ACCESS_MAX_AGE: 15 * 60, // 15 minutes
  REFRESH_MAX_AGE: 7 * 24 * 60 * 60, // 7 days
} as const;

// Google Sheets URL - should be moved to environment variables in production
export const GOOGLE_SHEET_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjjY9ad1RWnzfHErHYoC40-z9i85wqOe8wt3JA4q7PXqtJGMXj1Zlg3b_d0n_zTC5YiElEbb31dzpKJhp-pI-nz69XyadmLIR0QbthQZaAMjmaCdVRx1glkhPOW95pw1s5LW17bYHj6dlBmMNQo6WexCsuOskzqi5ZDX06_E7U2e-_bY4Ze_yAORX9hlqm67Zuk_aDn-W9AWLdMwvhQTYlxIPBn0egtF6LFLa-fnJCucqkxhkRBV3Ne8KDJhZK6wlLlQOwfqa6Lf1qNGAr0U16sWprLa3CVBrGfsjBs4FE5Y2JAV5Q&lib=MfUMAu43yfO2fKjBdhRibWzwPPqT7M8tq";
