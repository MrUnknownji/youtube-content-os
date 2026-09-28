export type ThemePreset = "forest" | "blue" | "violet" | "rose" | "orange";
export type ThemeRadius = "compact" | "default" | "rounded";

export interface ThemePreferences {
  preset: ThemePreset;
  radius: ThemeRadius;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  preset: "forest",
  radius: "default",
};

export const THEME_PRESET_OPTIONS: Array<{
  value: ThemePreset;
  label: string;
  color: string;
}> = [
  { value: "forest", label: "Forest", color: "oklch(0.62 0.16 144)" },
  { value: "blue", label: "Blue", color: "oklch(0.62 0.2 255)" },
  { value: "violet", label: "Violet", color: "oklch(0.61 0.22 292)" },
  { value: "rose", label: "Rose", color: "oklch(0.62 0.22 18)" },
  { value: "orange", label: "Orange", color: "oklch(0.68 0.2 45)" },
];

export const THEME_RADIUS_OPTIONS: Array<{
  value: ThemeRadius;
  label: string;
  description: string;
}> = [
  { value: "compact", label: "Compact", description: "Sharper corners" },
  { value: "default", label: "Default", description: "Balanced rounding" },
  { value: "rounded", label: "Rounded", description: "Softer corners" },
];

const STORAGE_KEY = "yco-theme-preferences";
const THEME_EVENT = "theme-preferences-changed";
const VALID_PRESETS = new Set<ThemePreset>(THEME_PRESET_OPTIONS.map(({ value }) => value));
const VALID_RADII = new Set<ThemeRadius>(THEME_RADIUS_OPTIONS.map(({ value }) => value));

export function getThemePreferences(): ThemePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PREFERENCES;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_THEME_PREFERENCES;

    const parsed = JSON.parse(stored) as Partial<ThemePreferences>;
    return {
      preset:
        parsed.preset && VALID_PRESETS.has(parsed.preset)
          ? parsed.preset
          : DEFAULT_THEME_PREFERENCES.preset,
      radius:
        parsed.radius && VALID_RADII.has(parsed.radius)
          ? parsed.radius
          : DEFAULT_THEME_PREFERENCES.radius,
    };
  } catch (error) {
    console.error("Failed to load theme preferences:", error);
    return DEFAULT_THEME_PREFERENCES;
  }
}

export function applyThemePreferences(preferences: ThemePreferences) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.themePreset = preferences.preset;
  root.dataset.radius = preferences.radius;
}

export function saveThemePreferences(preferences: ThemePreferences) {
  applyThemePreferences(preferences);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(
      new CustomEvent<ThemePreferences>(THEME_EVENT, { detail: preferences }),
    );
  } catch (error) {
    console.error("Failed to save theme preferences:", error);
  }
}

export function initializeThemePreferences() {
  const preferences = getThemePreferences();
  applyThemePreferences(preferences);
  return preferences;
}

export function subscribeToThemePreferences(
  listener: (preferences: ThemePreferences) => void,
) {
  if (typeof window === "undefined") return () => undefined;

  const handleChange = (event: Event) => {
    listener((event as CustomEvent<ThemePreferences>).detail);
  };

  window.addEventListener(THEME_EVENT, handleChange);
  return () => window.removeEventListener(THEME_EVENT, handleChange);
}
