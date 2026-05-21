import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'day' | 'night';

interface ThemeContextType {
  theme: Theme;
  isAuthenticated: boolean;
  requestNightMode: () => boolean;
  setTheme: (theme: Theme) => void;
  authenticate: () => void;
  logout: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('day');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const requestNightMode = () => {
    if (!isAuthenticated) {
      return false; // Authentication required
    }
    setTheme('night');
    return true;
  };

  const authenticate = () => {
    setIsAuthenticated(true);
    setTheme('night');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setTheme('day');
  };

  return (
    <ThemeContext.Provider value={{ theme, isAuthenticated, requestNightMode, setTheme, authenticate, logout }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
