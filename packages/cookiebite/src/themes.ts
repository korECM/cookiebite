export interface ThemeSeed {
  font: string;
  background: string;
  text: string;
  accent: string;
  spaceUnit: number;
  measure: string;
  radius: number;
  surface: 'border' | 'tonal' | 'shadow';
}

export interface ThemeDocument {
  schemaVersion: 1;
  seed: ThemeSeed;
  dark?: Partial<ThemeSeed>;
  status?: Record<string, string>;
  resources?: { fontStylesheets: string[] };
  locale?: { number: string; currency: string; symbol?: string; bigUnits?: boolean };
  overrides?: Partial<Record<'textMuted' | 'divider' | 'accentStrong' | 'surfaceRaised' | 'focus', string>>;
}

interface PresetJson {
  name: string;
  font: { family: string; url: string; fallback: string };
  seed: ThemeSeed;
  locale?: ThemeDocument['locale'];
}

export function fromPreset(preset: PresetJson): ThemeDocument {
  return {
    schemaVersion: 1,
    seed: { ...preset.seed },
    resources: { fontStylesheets: preset.font.url ? [preset.font.url] : [] },
    ...(preset.locale ? { locale: preset.locale } : {}),
  };
}

import persimmonJson from '../vendor/presets/persimmon.json' with { type: 'json' };
import neutralJson from '../vendor/presets/neutral.json' with { type: 'json' };
import stripeJson from '../vendor/presets/stripe.json' with { type: 'json' };
import vercelJson from '../vendor/presets/vercel.json' with { type: 'json' };
import linearJson from '../vendor/presets/linear.json' with { type: 'json' };
import notionJson from '../vendor/presets/notion.json' with { type: 'json' };
import supabaseJson from '../vendor/presets/supabase.json' with { type: 'json' };
import sentryJson from '../vendor/presets/sentry.json' with { type: 'json' };
import resendJson from '../vendor/presets/resend.json' with { type: 'json' };
import raycastJson from '../vendor/presets/raycast.json' with { type: 'json' };

export const persimmon: ThemeDocument = fromPreset(persimmonJson as PresetJson);
export const neutral: ThemeDocument = fromPreset(neutralJson as PresetJson);
export const stripe: ThemeDocument = fromPreset(stripeJson as PresetJson);
export const vercel: ThemeDocument = fromPreset(vercelJson as PresetJson);
export const linear: ThemeDocument = fromPreset(linearJson as PresetJson);
export const notion: ThemeDocument = fromPreset(notionJson as PresetJson);
export const supabase: ThemeDocument = fromPreset(supabaseJson as PresetJson);
export const sentry: ThemeDocument = fromPreset(sentryJson as PresetJson);
export const resend: ThemeDocument = fromPreset(resendJson as PresetJson);
export const raycast: ThemeDocument = fromPreset(raycastJson as PresetJson);
