import { Report, Section, Standfirst } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

/** SSR timestamp ≠ client timestamp → recoverable hydration mismatch. */
function LiveStamp() {
  return <span data-testid="live-stamp">{Date.now()}</span>;
}

export default function App() {
  return (
    <Report title="Hydration break fixture" kicker="Task 10">
      <Standfirst>Intentional SSR/client text diverge for hydration-warning.</Standfirst>
      <Section id="break" title="Break">
        <p>
          Live stamp: <LiveStamp />
        </p>
      </Section>
    </Report>
  );
}
