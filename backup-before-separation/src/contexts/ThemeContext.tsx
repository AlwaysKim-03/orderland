import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // localStorage에서 저장된 테마 설정 불러오기
    const saved = localStorage.getItem('orderland-theme');
    if (saved) {
      return saved === 'dark';
    }
    // 시스템 설정 확인
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // 테마 변경 시 localStorage에 저장
    localStorage.setItem('orderland-theme', isDarkMode ? 'dark' : 'light');
    
    // HTML 요소에 클래스 추가/제거
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
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