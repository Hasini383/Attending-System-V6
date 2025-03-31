import React from 'react';

/**
 * LoadingSpinner component for indicating loading states
 * 
 * @param {Object} props
 * @param {string} props.size - Size of the spinner ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {string} props.color - Color of the spinner ('blue', 'gray', 'green', 'red', 'yellow', 'purple', 'indigo', 'pink')
 * @param {string} props.className - Additional classes for the spinner container
 * @param {boolean} props.centered - Whether to center the spinner
 * @param {string} props.text - Text to display below the spinner
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '', 
  centered = false,
  text = ''
}) => {
  // Size mapping
  const sizeMap = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };

  // Color mapping
  const colorMap = {
    blue: 'border-blue-500',
    gray: 'border-gray-500 dark:border-gray-400',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
    indigo: 'border-indigo-500',
    pink: 'border-pink-500'
  };

  const spinnerSize = sizeMap[size] || sizeMap.md;
  const spinnerColor = colorMap[color] || colorMap.blue;
  
  const wrapperClasses = centered 
    ? 'flex items-center justify-center' 
    : '';
  
  return (
    <div className={`${wrapperClasses} ${className}`}>
      <div className={`animate-spin rounded-full ${spinnerSize} ${spinnerColor} border-t-transparent border-solid`}>
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 