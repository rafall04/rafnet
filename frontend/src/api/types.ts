// Domain Entities
export interface Package {
  id: number;
  name: string;
  speed: string;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Voucher {
  id: number;
  code: string;
  duration: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
}

// DTOs
export interface CreatePackageDTO {
  name: string;
  speed: string;
  price: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePackageDTO {
  name?: string;
  speed?: string;
  price?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateVoucherDTO {
  code: string;
  duration: string;
  price: number;
  isActive?: boolean;
}

export interface UpdateVoucherDTO {
  code?: string;
  duration?: string;
  price?: number;
  isActive?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
}
