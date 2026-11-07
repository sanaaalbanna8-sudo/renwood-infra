import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ThemeName = 'dark' | 'light';

type ThemeValue = {
  theme: ThemeName;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = 'renwood-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof localStorage === 'undefined') return 'dark';
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F3F6FB' : '#0B1020');
  }, [theme]);

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('theme');
  return value;
}
