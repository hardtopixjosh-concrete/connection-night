/**
 * Haptic feedback utility for mobile PWA
 * Uses the Vibration API when available
 */

export const haptic = {
  // Light tap - for selections, toggles
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium tap - for confirmations, button presses
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },

  // Heavy tap - for important actions, completions
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  // Success pattern - for positive outcomes
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  // Error pattern - for failures or warnings
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }
};
