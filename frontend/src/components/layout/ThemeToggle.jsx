import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { IconButton } from '../ui/Button';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
    >
      <Moon size={16} className="dark:hidden" aria-hidden="true" />
      <Sun size={16} className="hidden dark:block" aria-hidden="true" />
    </IconButton>
  );
};

export default ThemeToggle;
