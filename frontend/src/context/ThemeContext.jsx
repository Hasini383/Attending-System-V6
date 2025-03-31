import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check if theme is stored in local storage, otherwise use system preference
  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [isAnimating, setIsAnimating] = useState(false);
  const transitionCloneElement = useRef(null);
  const animationTimeoutRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);
  const buttonPositionRef = useRef({ x: 0, y: 0 });

  // Apply theme to the DOM whenever the theme state changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to local storage
    localStorage.setItem('theme', theme);
    console.log(`Theme changed to: ${theme}`);
  }, [theme]);

  // Clean up any timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(animationTimeoutRef.current);
      clearTimeout(cleanupTimeoutRef.current);
      
      // Remove any transition elements still in the DOM
      const existingTransitionElement = document.getElementById('theme-transition-container');
      if (existingTransitionElement && document.body.contains(existingTransitionElement)) {
        document.body.removeChild(existingTransitionElement);
      }
    };
  }, []);

  const toggleTheme = (event) => {
    // Don't do anything if already animating
    if (isAnimating) return;
    
    // Set animating state
    setIsAnimating(true);
    
    // Calculate the next theme
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    console.log(`Starting theme transition: ${theme} → ${nextTheme}`);
    
    // Store position of click
    const clickX = event ? event.clientX : 20;
    const clickY = event ? event.clientY : 20;
    
    // Remove any existing transition elements first
    const existingTransitionElement = document.getElementById('theme-transition-container');
    if (existingTransitionElement && document.body.contains(existingTransitionElement)) {
      document.body.removeChild(existingTransitionElement);
    }
    
    // Create new transition element
    const transitionContainer = document.createElement('div');
    transitionContainer.id = 'theme-transition-container';
    transitionContainer.style.position = 'fixed';
    transitionContainer.style.top = '0';
    transitionContainer.style.left = '0';
    transitionContainer.style.width = '100%';
    transitionContainer.style.height = '100%';
    transitionContainer.style.zIndex = '999';
    transitionContainer.style.pointerEvents = 'none';
    transitionContainer.style.backgroundColor = nextTheme === 'dark' ? '#0f172a' : '#ffffff';
    
    // Set initial clip path to be a small circle at the button position
    transitionContainer.style.clipPath = `circle(0px at ${clickX}px ${clickY}px)`;
    
    // Append to body
    document.body.appendChild(transitionContainer);
    transitionCloneElement.current = transitionContainer;
    
    // Force reflow to ensure animation works
    void transitionContainer.offsetWidth;
    
    // Start the expansion animation
    transitionContainer.style.transition = 'clip-path 700ms cubic-bezier(0.19, 1, 0.22, 1)';
    
    // Calculate the maximum distance to ensure the circle covers the entire screen
    const maxDimension = Math.max(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight
    );
    const radius = Math.sqrt(Math.pow(maxDimension, 2) * 2) + 100; // Diagonal of the screen plus margin
    
    // Expand clip path to cover entire screen
    transitionContainer.style.clipPath = `circle(${radius}px at ${clickX}px ${clickY}px)`;
    
    // Set the theme halfway through the animation
    clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = setTimeout(() => {
      // Apply the new theme
      setTheme(nextTheme);
    }, 350);

    // Clean up the element after animation completes
    clearTimeout(cleanupTimeoutRef.current);
    cleanupTimeoutRef.current = setTimeout(() => {
      // Fade out transition container
      if (transitionContainer && document.body.contains(transitionContainer)) {
        transitionContainer.style.transition = 'opacity 200ms ease-out';
        transitionContainer.style.opacity = '0';
        
        // Remove the element after fade out completes
        setTimeout(() => {
          if (transitionContainer && document.body.contains(transitionContainer)) {
            document.body.removeChild(transitionContainer);
          }
          setIsAnimating(false);
          console.log('Theme transition complete');
        }, 200);
      } else {
        setIsAnimating(false);
      }
    }, 700);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAnimating }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 