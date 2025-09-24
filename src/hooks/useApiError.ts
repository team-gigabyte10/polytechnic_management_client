import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ApiError {
  message: string;
  isRateLimited: boolean;
  retryAfter?: number;
  status?: number;
}

export const useApiError = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback((error: any, customMessage?: string) => {
    console.error('API Error:', error);

    let errorMessage = customMessage || 'An error occurred';
    let isRateLimited = false;
    let retryAfter = 0;

    // Handle rate limiting errors
    if (error?.isRateLimited || error?.response?.status === 429) {
      isRateLimited = true;
      retryAfter = error?.retryAfter || 5; // Default 5 seconds
      errorMessage = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      
      // Show a more informative toast for rate limiting
      toast.error(errorMessage, {
        duration: retryAfter * 1000,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        },
      });
    } else if (error?.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
      toast.error(errorMessage);
    } else if (error?.response?.status === 404) {
      errorMessage = 'Resource not found.';
      toast.error(errorMessage);
    } else if (error?.response?.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
      toast.error(errorMessage);
    } else if (error?.response?.status === 401) {
      errorMessage = 'Please log in to continue.';
      toast.error(errorMessage);
      // Optionally redirect to login
      // window.location.href = '/login';
    } else if (error?.message) {
      errorMessage = error.message;
      toast.error(errorMessage);
    } else {
      toast.error(errorMessage);
    }

    return {
      message: errorMessage,
      isRateLimited,
      retryAfter,
      status: error?.response?.status,
    };
  }, []);

  const handleRetry = useCallback(async (
    retryFn: () => Promise<any>,
    maxRetries: number = 3
  ) => {
    if (retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached. Please try again later.');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      const result = await retryFn();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      const errorInfo = handleError(error);
      if (errorInfo.isRateLimited) {
        // Wait before retrying for rate limited requests
        setTimeout(() => {
          setIsRetrying(false);
        }, errorInfo.retryAfter * 1000);
      } else {
        setIsRetrying(false);
      }
      throw error;
    }
  }, [retryCount, handleError]);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    handleError,
    handleRetry,
    isRetrying,
    retryCount,
    resetRetry,
  };
};

export default useApiError;
