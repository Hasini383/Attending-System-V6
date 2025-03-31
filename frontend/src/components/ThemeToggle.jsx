import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme, isAnimating } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-7 flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? '#1e40af' : '#e5e7eb', // blue-800 for dark, gray-200 for light
      }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      disabled={isAnimating}
    >
      {/* Track */}
      <span 
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          isDark ? 'bg-blue-800' : 'bg-gray-200'
        }`}
      />
      
      {/* Toggle handle with icons */}
      <motion.span 
        className={`absolute left-0.5 flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-colors duration-200 ${
          isDark ? 'bg-blue-400' : 'bg-white'
        }`}
        animate={{ 
          x: isDark ? 26 : 0,
        }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-blue-900" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </motion.span>
      
      {/* Background icons */}
      <span className={`absolute right-2 transition-opacity duration-150 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <Moon className="h-3 w-3 text-blue-200" />
      </span>
      <span className={`absolute left-2 transition-opacity duration-150 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <Sun className="h-3 w-3 text-yellow-400" />
      </span>
    </motion.button>
  );
};

export default ThemeToggle; 