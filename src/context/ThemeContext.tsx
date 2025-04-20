'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Don't set a default state immediately
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // First useEffect: Run once on mount to get the theme from localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light') {
        setIsDark(false);
      } else {
        setIsDark(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage for theme management:", error);
      setIsDark(true); // Fallback to dark mode
    }
  }, []);

  // Second useEffect: Update the DOM and localStorage when theme changes
  useEffect(() => {
    // Skip the first render when isDark is null
    if (isDark === null) return;
    
    try {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error("Error setting localStorage or updating classes:", error);
    }
  }, [isDark]);

  // Use null-check to avoid rendering children before theme is determined
  return (
    <ThemeContext.Provider value={{ 
      isDark: isDark ?? true, 
      setIsDark: (value) => { setIsDark(value); }
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme needs to be used within ThemeProvider');
  return context;
};
