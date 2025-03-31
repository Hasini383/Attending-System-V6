import { toast } from 'react-hot-toast';

/**
 * Toast helper functions for consistent notifications
 * 
 * Use these functions instead of directly using toast to ensure
 * consistent styling and behavior across the application
 */

// Success toast with consistent styling
export const showSuccessToast = (message) => {
  return toast.success(message, {
    id: `success-${Date.now()}`, // Ensure unique ID
    duration: 5000,
  });
};

// Error toast with consistent styling
export const showErrorToast = (message) => {
  return toast.error(message, {
    id: `error-${Date.now()}`,
    duration: 7000, // Longer duration for errors
  });
};

// Info toast with consistent styling
export const showInfoToast = (message) => {
  return toast(message, {
    id: `info-${Date.now()}`,
    icon: '🔔',
    duration: 5000,
  });
};

// Warning toast with custom styling
export const showWarningToast = (message) => {
  return toast(message, {
    id: `warning-${Date.now()}`,
    icon: '⚠️',
    duration: 6000,
    style: {
      borderLeft: '4px solid #f59e0b', // Amber color for warnings
    },
  });
};

// Loading toast with ability to update status
export const showLoadingToast = (message) => {
  const toastId = toast.loading(message, {
    id: `loading-${Date.now()}`,
  });
  
  // Return functions to update or dismiss the toast
  return {
    // Update the loading toast (e.g., to show progress)
    updateLoading: (newMessage) => {
      toast.loading(newMessage, { id: toastId });
    },
    // Convert to success when operation completes
    success: (successMessage) => {
      toast.success(successMessage, { id: toastId });
    },
    // Convert to error if operation fails
    error: (errorMessage) => {
      toast.error(errorMessage, { id: toastId });
    },
    // Dismiss the toast
    dismiss: () => {
      toast.dismiss(toastId);
    }
  };
};

// Dismiss all active toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Default export for easier imports
const ToastHelper = {
  success: showSuccessToast,
  error: showErrorToast,
  info: showInfoToast,
  warning: showWarningToast,
  loading: showLoadingToast,
  dismissAll: dismissAllToasts,
};

export default ToastHelper; 