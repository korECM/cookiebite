import { useEffect, useState, type ReactNode } from 'react';
import { Moon, Rows3, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const THEME_STORAGE_KEY = 'cookiebite-theme';
export const DENSITY_STORAGE_KEY = 'cookiebite-density';

/** Task 7 assemble이 head에 주입. comfortable = TW 기본(--spacing 0.25rem)이라 규칙 없음. */
/**
 * 밀도 + 인쇄 시 hidden 복원(TW print:block 폴백). `[data-cb-reveal]`는
 * ResultBlock이 접어 둔 표/쿼리 — 지면에는 접힘이 없으므로 되살린다.
 */
export const SHELL_CSS = `:root[data-density="compact"]{--spacing:0.2rem}:root[data-density="spacious"]{--spacing:0.3rem}@media print{[data-page].hidden{display:block!important}[data-cb-reveal].hidden{display:block!important}[data-cb-controls]{display:none!important}}`;

const DENSITIES = ['compact', 'comfortable', 'spacious'] as const;
type Density = (typeof DENSITIES)[number];

function readTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* SSR / private mode */
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function readDensity(): Density {
  try {
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
    if (stored === 'compact' || stored === 'comfortable' || stored === 'spacious') {
      return stored;
    }
  } catch {
    /* SSR / private mode */
  }
  const attr = document.documentElement.dataset.density;
  if (attr === 'compact' || attr === 'comfortable' || attr === 'spacious') return attr;
  return 'comfortable';
}

export function Controls({ className }: { className?: string }): ReactNode {
  // SSR: 정적 아이콘, aria. 클릭 핸들러만 DOM/localStorage 접근. 하이드레이션 후 동기화.
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<Density>('comfortable');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const theme = readTheme();
    const dens = readDensity();
    setDark(theme === 'dark');
    setDensity(dens);
    setHydrated(true);
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(next);
  }

  function cycleDensity() {
    const current = readDensity();
    const idx = DENSITIES.indexOf(current);
    const next = DENSITIES[(idx + 1) % DENSITIES.length]!;
    document.documentElement.dataset.density = next;
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setDensity(next);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg border bg-card p-0.5 shadow-xs',
        className,
      )}
      role="group"
      aria-label="Report controls"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        aria-pressed={hydrated ? dark : false}
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        <span className="sr-only">{dark ? 'Light' : 'Dark'}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={cycleDensity}
        aria-label="Cycle density"
        aria-pressed={hydrated ? density !== 'comfortable' : false}
      >
        <Rows3 aria-hidden="true" />
        <span className="sr-only">{density}</span>
      </Button>
    </div>
  );
}
