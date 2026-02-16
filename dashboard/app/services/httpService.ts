import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ApiResponse } from '~/types/httpService';
import { createErrorResponse, handleAxiosError } from '~/utils/errorHandler';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

class HttpService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 10000,
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Attempt token refresh on 401 (skip for auth endpoints to avoid loops)
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/')
        ) {
          originalRequest._retry = true;
          try {
            await this.api.get('/auth/refresh-access-token');
            return this.api(originalRequest);
          } catch {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        }

        const errorResponse = createErrorResponse(error);
        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * Extracts the data property from ResponsePayloadDto wrapper
   */
  private extractData<T>(responsePayload: ApiResponse<T>): T {
    return responsePayload.data as T;
  }

  // Enhanced error handling for HTTP methods
  public async get<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.post<ApiResponse<T>>(url, data, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.patch<ApiResponse<T>>(url, data, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url, config);
      return this.extractData(response.data);
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  /**
   * Get paginated response with both data array and meta information.
   * Use this for list endpoints that return PaginatedResponseDto.
   */
  public async getPaginated<T>(url: string, config?: AxiosRequestConfig<any>): Promise<{ data: T[]; meta: PaginationMeta }> {
    try {
      const response = await this.api.get(url, config);
      const payload = response.data;
      return {
        data: (payload.data ?? []) as T[],
        meta: payload.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      };
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  /**
   * Get full response payload when you need access to success, message, etc.
   */
  public async getFullResponse<T>(url: string, config?: AxiosRequestConfig<any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
}

export const httpService = new HttpService();