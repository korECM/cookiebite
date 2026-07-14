import type { ThemeDocument, ThemeSeed } from '../src/themes.ts';

export declare function deriveDarkSeed(
  seed: ThemeSeed,
): Pick<ThemeSeed, 'background' | 'text' | 'accent' | 'surface'>;

export declare function resolveTheme(doc: ThemeDocument): ThemeDocument;
