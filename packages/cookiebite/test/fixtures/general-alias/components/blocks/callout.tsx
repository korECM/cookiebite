import type { ReactNode } from 'react';

export function Callout({ children }: { children?: ReactNode }) {
  return <aside data-slot="local-callout">{children}</aside>;
}
