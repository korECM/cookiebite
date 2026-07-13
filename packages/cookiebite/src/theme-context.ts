import { createContext } from 'react';
import type { ThemeDocument } from './themes.ts';

export const ThemeContext = createContext<ThemeDocument | null>(null);
