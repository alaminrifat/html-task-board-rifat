export interface ErrorResponse {
  message: string;
  status: number;
  fieldErrors?: Array<{
    field?: string;
    reason?: string;
    constraints?: Record<string, string>;
    code?: string;
  }>;
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  data?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: Array<{
    field?: string;
    reason?: string;
    constraints?: Record<string, string>;
    code?: string;
  }>;
  timestamp?: string;
  path?: string;
}