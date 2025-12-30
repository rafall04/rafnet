import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Package,
  Voucher,
  AdminUser,
  CreatePackageDTO,
  UpdatePackageDTO,
  CreateVoucherDTO,
  UpdateVoucherDTO,
  LoginCredentials,
  AuthResponse,
  ApiError,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'raf_net_token';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem(TOKEN_KEY);
      // Optionally redirect to login
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Token management
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  removeToken: (): void => localStorage.removeItem(TOKEN_KEY),
  hasToken: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};


// API Client
export const apiClient = {
  // ============ Public Endpoints ============
  
  /**
   * Get all active packages (public)
   * Requirements: 1.3
   */
  getActivePackages: async (): Promise<Package[]> => {
    const response = await axiosInstance.get<Package[]>('/packages/active');
    return response.data;
  },

  /**
   * Get all active vouchers (public)
   */
  getActiveVouchers: async (): Promise<Voucher[]> => {
    const response = await axiosInstance.get<Voucher[]>('/vouchers/active');
    return response.data;
  },

  // ============ Auth Endpoints ============
  
  /**
   * Login with credentials
   * Requirements: 2.1
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      tokenManager.setToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Logout - clear token
   */
  logout: (): void => {
    tokenManager.removeToken();
  },

  /**
   * Get current user info
   * Requirements: 2.3
   */
  getCurrentUser: async (): Promise<AdminUser> => {
    const response = await axiosInstance.get<AdminUser>('/auth/me');
    return response.data;
  },

  // ============ Package Endpoints (Protected) ============
  
  /**
   * Get all packages
   * Requirements: 3.2
   */
  getPackages: async (): Promise<Package[]> => {
    const response = await axiosInstance.get<Package[]>('/packages');
    return response.data;
  },

  /**
   * Get package by ID
   */
  getPackageById: async (id: number): Promise<Package> => {
    const response = await axiosInstance.get<Package>(`/packages/${id}`);
    return response.data;
  },

  /**
   * Create a new package
   * Requirements: 3.1
   */
  createPackage: async (data: CreatePackageDTO): Promise<Package> => {
    const response = await axiosInstance.post<Package>('/packages', data);
    return response.data;
  },

  /**
   * Update a package
   * Requirements: 3.3
   */
  updatePackage: async (id: number, data: UpdatePackageDTO): Promise<Package> => {
    const response = await axiosInstance.put<Package>(`/packages/${id}`, data);
    return response.data;
  },

  /**
   * Delete a package
   * Requirements: 3.4
   */
  deletePackage: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/packages/${id}`);
  },

  // ============ Voucher Endpoints (Protected) ============
  
  /**
   * Get all vouchers
   * Requirements: 4.2
   */
  getVouchers: async (): Promise<Voucher[]> => {
    const response = await axiosInstance.get<Voucher[]>('/vouchers');
    return response.data;
  },

  /**
   * Get voucher by ID
   */
  getVoucherById: async (id: number): Promise<Voucher> => {
    const response = await axiosInstance.get<Voucher>(`/vouchers/${id}`);
    return response.data;
  },

  /**
   * Create a new voucher
   * Requirements: 4.1
   */
  createVoucher: async (data: CreateVoucherDTO): Promise<Voucher> => {
    const response = await axiosInstance.post<Voucher>('/vouchers', data);
    return response.data;
  },

  /**
   * Update a voucher
   * Requirements: 4.3
   */
  updateVoucher: async (id: number, data: UpdateVoucherDTO): Promise<Voucher> => {
    const response = await axiosInstance.put<Voucher>(`/vouchers/${id}`, data);
    return response.data;
  },

  /**
   * Delete a voucher
   * Requirements: 4.4
   */
  deleteVoucher: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/vouchers/${id}`);
  },
};

export default apiClient;
