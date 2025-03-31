/**
 * Utility functions for formatting dates and other data
 */

import { DateTime } from 'luxon';

/**
 * Format a date object or date string to a readable format
 * 
 * @param {Date|string} date - The date to format
 * @param {Object} options - Format options
 * @param {boolean} options.includeTime - Whether to include the time in the format
 * @param {boolean} options.shortMonth - Whether to use short month names
 * @param {string} options.separator - Separator between date parts
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const {
    includeTime = false,
    shortMonth = false,
    separator = '/'
  } = options;
  
  // Get date components
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  
  // Format the date part
  let formattedDate = `${padZero(day)}${separator}${padZero(month)}${separator}${year}`;
  
  // Format the time part if requested
  if (includeTime) {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    
    const isPM = hours >= 12;
    const hour12 = hours % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';
    
    formattedDate += ` ${padZero(hour12)}:${padZero(minutes)} ${ampm}`;
  }
  
  return formattedDate;
};

/**
 * Format a time string (HH:MM) to 12-hour format with AM/PM
 * 
 * @param {string} timeString - Time string in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format with AM/PM
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    if (isNaN(hour) || isNaN(minute)) return timeString;
    
    const isPM = hour >= 12;
    const hour12 = hour % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';
    
    return `${hour12}:${padZero(minute)} ${ampm}`;
  } catch (error) {
    return timeString;
  }
};

/**
 * Format a date string to time ago format (e.g., "2 hours ago")
 * 
 * @param {Date|string} date - The date to format
 * @returns {string} Time ago string
 */
export const timeAgo = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // For anything older than a week, return the formatted date
  return formatDate(dateObj, { includeTime: false });
};

/**
 * Pad a number with leading zero if it's less than 10
 * 
 * @param {number} num - Number to pad
 * @returns {string} Padded number
 * @private
 */
const padZero = (num) => {
  return num < 10 ? `0${num}` : `${num}`;
};

/**
 * Format a number as a currency
 * 
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code, default is USD
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Format a percentage value
 * 
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text to specified length with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format a name to the desired format
 * 
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {Object} options - Format options 
 * @param {boolean} options.lastNameFirst - Show last name first (default: false)
 * @param {boolean} options.upperCase - Convert to uppercase (default: false)
 * @returns {string} Formatted name
 */
export const formatName = (firstName = '', lastName = '', options = {}) => {
  if (!firstName && !lastName) return '';
  
  const { lastNameFirst = false, upperCase = false } = options;
  
  let formattedName;
  
  if (lastNameFirst) {
    formattedName = lastName && firstName 
      ? `${lastName}, ${firstName}` 
      : lastName || firstName;
  } else {
    formattedName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : firstName || lastName;
  }
  
  return upperCase ? formattedName.toUpperCase() : formattedName;
};

/**
 * Calculate duration between entry and leave times, handling various date formats
 * 
 * @param {*} entryTime - The entry time in any supported format
 * @param {*} leaveTime - The leave time in any supported format
 * @returns {string} Formatted duration string
 */
export const calculateEnhancedDuration = (entryTime, leaveTime) => {
  if (!entryTime || !leaveTime) return 'N/A';
  
  try {
    let entryDateTime, leaveDateTime;
    
    // Parse entry time
    if (typeof entryTime === 'object' && entryTime.$date) {
      if (entryTime.$date.$numberLong) {
        entryDateTime = DateTime.fromMillis(parseInt(entryTime.$date.$numberLong));
      } else if (typeof entryTime.$date === 'string') {
        entryDateTime = DateTime.fromISO(entryTime.$date);
      }
    } else if (entryTime instanceof Date) {
      entryDateTime = DateTime.fromJSDate(entryTime);
    } else if (typeof entryTime === 'string') {
      entryDateTime = DateTime.fromISO(entryTime);
    } else if (typeof entryTime === 'number') {
      entryDateTime = DateTime.fromMillis(entryTime);
    } else {
      const fallbackDate = new Date(entryTime);
      if (!isNaN(fallbackDate.getTime())) {
        entryDateTime = DateTime.fromJSDate(fallbackDate);
      }
    }
    
    // Parse leave time
    if (typeof leaveTime === 'object' && leaveTime.$date) {
      if (leaveTime.$date.$numberLong) {
        leaveDateTime = DateTime.fromMillis(parseInt(leaveTime.$date.$numberLong));
      } else if (typeof leaveTime.$date === 'string') {
        leaveDateTime = DateTime.fromISO(leaveTime.$date);
      }
    } else if (leaveTime instanceof Date) {
      leaveDateTime = DateTime.fromJSDate(leaveTime);
    } else if (typeof leaveTime === 'string') {
      leaveDateTime = DateTime.fromISO(leaveTime);
    } else if (typeof leaveTime === 'number') {
      leaveDateTime = DateTime.fromMillis(leaveTime);
    } else {
      const fallbackDate = new Date(leaveTime);
      if (!isNaN(fallbackDate.getTime())) {
        leaveDateTime = DateTime.fromJSDate(fallbackDate);
      }
    }
    
    // If we couldn't parse either time, return N/A
    if (!entryDateTime || !entryDateTime.isValid || !leaveDateTime || !leaveDateTime.isValid) {
      return 'N/A';
    }
    
    // Calculate duration in minutes
    const minutes = leaveDateTime.diff(entryDateTime, 'minutes').minutes;
    
    // Format the duration
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  } catch (e) {
    return 'N/A';
  }
}; 