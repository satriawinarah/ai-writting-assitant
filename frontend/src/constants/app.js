/**
 * Application-wide constants.
 *
 * Centralized location for magic numbers, timeouts, and other
 * configuration values used across the application.
 */

// ==========================================
// Timing Constants
// ==========================================

/** Debounce delay for auto-saving chapter content (ms) */
export const SAVE_DEBOUNCE_MS = 1000;

/** API request timeout (ms) */
export const API_TIMEOUT_MS = 30000;

// ==========================================
// Notification Durations
// ==========================================

export const NOTIFICATION_DURATION = {
  ERROR: 8000,
  SUCCESS: 4000,
  WARNING: 6000,
  INFO: 5000,
};

// ==========================================
// AI Feature Constants
// ==========================================

/** Minimum character count for text continuation */
export const MIN_CHAR_FOR_CONTINUATION = 50;

/** Minimum character count for title suggestion */
export const MIN_CHAR_FOR_TITLE = 100;

/** Minimum character count for live review */
export const MIN_CHAR_FOR_REVIEW = 50;

/** Maximum tokens for AI generation */
export const MAX_GENERATION_TOKENS = 10000;

/** Default temperature for AI generation */
export const DEFAULT_TEMPERATURE = 0.7;

// ==========================================
// Default Values
// ==========================================

/** Default title for new chapters */
export const DEFAULT_CHAPTER_TITLE = 'Chapter 1';

/** Default order for new chapters */
export const DEFAULT_CHAPTER_ORDER = 0;

// ==========================================
// Validation
// ==========================================

/** Maximum length for project title */
export const MAX_PROJECT_TITLE_LENGTH = 200;

/** Maximum length for chapter title */
export const MAX_CHAPTER_TITLE_LENGTH = 200;

/** Maximum length for project description */
export const MAX_DESCRIPTION_LENGTH = 1000;

// ==========================================
// Paragraph Options
// ==========================================

export const PARAGRAPH_COUNT_OPTIONS = [
  { value: 1, label: '1 paragraph' },
  { value: 2, label: '2 paragraphs' },
  { value: 3, label: '3 paragraphs' },
  { value: 4, label: '4 paragraphs' },
  { value: 5, label: '5 paragraphs' },
];

// ==========================================
// Views
// ==========================================

export const VIEWS = {
  EDITOR: 'editor',
  SETTINGS: 'settings',
};

// ==========================================
// Local Storage Keys
// ==========================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER: 'user',
  EXPANDED_PROJECTS: 'expandedProjects',
  SELECTED_MODEL: 'selectedModel',
};
