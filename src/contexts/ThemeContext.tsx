import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    // localStorage에서 저장된 테마 설정 불러오기
    const saved = localStorage.getItem('orderland-theme');
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      return saved;
    }
    return 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  useEffect(() => {
    // 테마 변경 시 localStorage에 저장
    localStorage.setItem('orderland-theme', theme);
    
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        setIsDarkMode(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // HTML 요소에 클래스 추가/제거
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, isDarkMode]);

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const setDarkMode = (dark: boolean) => {
    setTheme(dark ? 'dark' : 'light');
  };

  const handleSetTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDarkMode(newTheme === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleDarkMode, 
      setDarkMode, 
      theme, 
      setTheme: handleSetTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 