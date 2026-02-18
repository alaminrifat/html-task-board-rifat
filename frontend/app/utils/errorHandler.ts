import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse, ErrorResponse } from '~/types/httpService';

export const createErrorResponse = (error: AxiosError<ApiErrorResponse>): ErrorResponse => {
  const errorResponse: ErrorResponse = {
    message: 'An unexpected error occurred',
    status: 500,
  };

  if (error.response) {
    errorResponse.status = error.response.status;
    errorResponse.message = error.response.data?.message || error.message;

    switch (error.response.status) {
      case 401:
        // Token refresh is handled by httpService interceptor — no hard redirect here
        errorResponse.message = error.response.data?.message || 'Authentication required';
        break;
      case 403:
        errorResponse.message = error.response.data?.message || 'Access denied';
        break;
      case 404:
        errorResponse.message = error.response.data?.message || 'Resource not found';
        break;
      case 422:
        errorResponse.message = error.response.data?.message || 'Validation failed';
        break;
      case 500:
        errorResponse.message = error.response.data?.message || 'Server error';
        break;
    }
  } else if (error.request) {
    errorResponse.message = 'No response from server';
    errorResponse.status = 503;
  }

  return errorResponse;
};

export const handleUnauthorized = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const handleAxiosError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    return error.response?.data || {
      message: error.message,
      status: error.response?.status || 500,
    };
  }
  // Handle already-transformed ErrorResponse from interceptor
  if (error && typeof error === 'object' && 'message' in error && 'status' in error) {
    return error as ErrorResponse;
  }
  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
};
