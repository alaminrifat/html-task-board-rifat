import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ApiResponse } from '~/types/httpService';
import type { PaginatedResponse } from '~/types/common';
import { createErrorResponse, handleAxiosError } from '~/utils/errorHandler';
import { tokenStorage } from '~/utils/tokenStorage';
import { API_URL } from '~/lib/constants';

class HttpService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  private processQueue(error: unknown | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(undefined);
      }
    });
    this.failedQueue = [];
  }

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 seconds (slightly longer for mobile networks)
    });

    // Request interceptor — attach Bearer token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor — attempts token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retrying and not the refresh or login endpoint itself
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh-access-token') &&
          !originalRequest.url?.includes('/auth/login')
        ) {
          if (this.isRefreshing) {
            // Queue this request until refresh completes
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => this.api(originalRequest));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.api.post('/auth/refresh-access-token', {
              refreshToken,
            });

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data ?? response.data;
            await tokenStorage.setTokens(newAccessToken, newRefreshToken);

            this.processQueue(null);
            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            // Clear tokens on refresh failure so auth state resets
            await tokenStorage.clearTokens();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
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

  public async getPaginated<T>(url: string, config?: AxiosRequestConfig<any>): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.api.get(url, config);
      const payload = response.data;
      return {
        data: payload.data ?? [],
        meta: {
          page: payload.meta?.page ?? 1,
          limit: payload.meta?.limit ?? 10,
          total: payload.meta?.total ?? 0,
          totalPages: payload.meta?.totalPages ?? 0,
          hasNextPage: payload.meta?.hasNextPage ?? false,
          hasPreviousPage: payload.meta?.hasPreviousPage ?? false,
        },
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
