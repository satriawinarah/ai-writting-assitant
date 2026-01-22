import { useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook for handling API errors with user-friendly notifications
 */
export default function useErrorHandler() {
  const { showError } = useNotifications();

  const handleError = useCallback((error, defaultMessage = 'An error occurred') => {
    let message = defaultMessage;
    let details = null;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      // Extract error message from response
      if (typeof data === 'string') {
        message = data;
      } else if (data?.detail) {
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Validation errors from FastAPI
          message = 'Validation error';
          details = data.detail.map(err => `${err.loc?.join(' > ')}: ${err.msg}`).join(', ');
        }
      } else if (data?.message) {
        message = data.message;
      }

      // Add status-specific messages
      if (status === 403) {
        message = 'You do not have permission to perform this action';
      } else if (status === 404) {
        message = 'The requested resource was not found';
      } else if (status === 429) {
        message = 'Too many requests. Please try again later';
      } else if (status >= 500) {
        message = 'Server error. Please try again later';
        details = 'If the problem persists, please contact support';
      }
    } else if (error.request) {
      // Request made but no response received
      if (error.code === 'ECONNABORTED') {
        message = 'Request timeout. Please check your connection';
      } else {
        message = 'Network error. Please check your internet connection';
      }
    } else if (error.message) {
      // Something else happened
      message = error.message;
    }

    showError(message, { details });
  }, [showError]);

  return { handleError };
}
