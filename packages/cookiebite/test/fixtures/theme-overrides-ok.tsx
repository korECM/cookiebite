import { Report, Section } from 'cookiebite';
import { persimmon, type ThemeDocument } from 'cookiebite/themes';

export const __theme: ThemeDocument = {
  ...persimmon,
  overrides: {
    '--chart-3': 'oklch(0.72 0.15 40)',
    '.dark': { '--card': '#1A1A1E' },
  },
};

export default function App() {
  return (
    <Report title="overrides typecheck">
      <Section id="summary" title="요약">
        <p>ThemeDocument overrides shape fixture.</p>
      </Section>
    </Report>
  );
}
