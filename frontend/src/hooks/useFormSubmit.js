import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for handling form submissions with error handling
 * @param {Function} submitFn - The function to call on form submission
 * @param {Object} options - Additional options
 * @returns {Object} - Form submission state and handler
 */
const useFormSubmit = (submitFn, options = {}) => {
  const { onSuccess, onError, successMessage } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e, formData) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the submit function with form data
      const result = await submitFn(formData);
      
      // Show success message if provided
      if (successMessage) {
        toast.success(successMessage);
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Prevent page reload on error
      e.preventDefault();
      
      let errorMessage;
      
      // Handle network errors
      if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      } 
      // Handle server errors
      else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      // Handle validation errors
      else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Please check your information and try again.';
      }
      // Handle authentication errors
      else if (error.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      }
      // Handle other errors
      else {
        errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Call onError callback if provided
      if (onError) {
        onError(error, errorMessage);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    handleSubmit
  };
};

export default useFormSubmit; 