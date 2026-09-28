import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_THEME_PREFERENCES,
  getThemePreferences,
  saveThemePreferences,
  subscribeToThemePreferences,
  THEME_PRESET_OPTIONS,
  THEME_RADIUS_OPTIONS,
  type ThemePreferences,
  type ThemePreset,
  type ThemeRadius,
} from "@/lib/theme-preferences";

const THEME_MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemeMode = (typeof THEME_MODES)[number]["value"];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<ThemePreferences>(
    getThemePreferences,
  );

  useEffect(
    () => subscribeToThemePreferences(setPreferences),
    [],
  );

  const updatePreferences = (next: ThemePreferences) => {
    setPreferences(next);
    saveThemePreferences(next);
  };

  const handlePresetChange = (preset: ThemePreset) => {
    updatePreferences({ ...preferences, preset });
  };

  const handleRadiusChange = (radius: ThemeRadius) => {
    updatePreferences({ ...preferences, radius });
  };

  const handleReset = () => {
    updatePreferences(DEFAULT_THEME_PREFERENCES);
    setTheme("dark");
  };

  const activeTheme = (theme ?? "dark") as ThemeMode;

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/15 p-2">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Appearance</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Personalize the global shadcn theme. Changes apply instantly.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 shrink-0 px-2 text-muted-foreground"
          title="Reset appearance"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:ml-1.5">Reset</span>
        </Button>
      </div>

      <div className="space-y-2.5">
        <Label>Mode</Label>
        <div className="grid grid-cols-3 gap-2">
          {THEME_MODES.map(({ value, label, icon: Icon }) => {
            const selected = activeTheme === value;
            return (
              <Button
                key={value}
                type="button"
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(value)}
                aria-pressed={selected}
                className="justify-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <Label>Color theme</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Updates primary, accent, charts, focus rings, and sidebar colors.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {THEME_PRESET_OPTIONS.map((option) => {
            const selected = preferences.preset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePresetChange(option.value)}
                aria-pressed={selected}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: option.color }}
                />
                <span>{option.label}</span>
                {selected && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <Label>Corner radius</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Adjusts the shared shadcn radius token across the interface.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_RADIUS_OPTIONS.map((option) => {
            const selected = preferences.radius === option.value;
            const previewRadius =
              option.value === "compact"
                ? "6px"
                : option.value === "rounded"
                  ? "16px"
                  : "10px";

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRadiusChange(option.value)}
                aria-pressed={selected}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted/60"
                }`}
              >
                <span
                  className="h-5 w-full border border-primary/50 bg-primary/10"
                  style={{ borderRadius: previewRadius }}
                />
                <span className="text-xs font-medium text-foreground">
                  {option.label}
                </span>
                <span className="hidden text-[11px] text-muted-foreground sm:block">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
