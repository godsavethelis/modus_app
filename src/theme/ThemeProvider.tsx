/**
 * Тема приложения: светлая/тёмная. Активная палитра раздаётся через контекст,
 * переключается в профиле. На вебе выбор сохраняется в localStorage.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { palette, paletteDark, type Palette } from './tokens';

type Mode = 'light' | 'dark';

interface ThemeValue {
  mode: Mode;
  colors: Palette;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);
const STORAGE_KEY = 'modus.theme';

function loadMode(): Mode {
  if (Platform.OS === 'web') {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Mode) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
  return 'light';
}

function persist(mode: Mode) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* noop */
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(loadMode);

  const value = useMemo<ThemeValue>(() => {
    const setMode = (m: Mode) => {
      persist(m);
      setModeState(m);
    };
    return {
      mode,
      colors: (mode === 'dark' ? paletteDark : palette) as Palette,
      toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'),
      setMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return ctx;
}
