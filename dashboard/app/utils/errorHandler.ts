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

    // F-018: Preserve field-level validation errors from backend
    const backendErrors = (error.response.data as any)?.error;
    if (Array.isArray(backendErrors) && backendErrors.length > 0) {
      errorResponse.fieldErrors = backendErrors;
    }

    switch (error.response.status) {
      case 403:
        errorResponse.message = 'Access denied';
        break;
      case 404:
        errorResponse.message = 'Resource not found';
        break;
      case 422:
        errorResponse.message = 'Validation failed';
        break;
      case 500:
        errorResponse.message = 'Server error';
        break;
      // 401 is now handled by httpService interceptor (F-016)
    }
  } else if (error.request) {
    errorResponse.message = 'No response from server';
    errorResponse.status = 503;
  }

  return errorResponse;
};

export const handleAxiosError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    return error.response?.data || {
      message: error.message,
      status: error.response?.status || 500,
    };
  }
  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
};