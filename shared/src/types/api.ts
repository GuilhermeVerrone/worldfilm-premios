export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JwtPayloadVendedor {
  id: string;
  nome: string;
  distribuidor_id: string;
  role: 'vendedor';
}

export interface JwtPayloadAdmin {
  id: string;
  email: string;
  role: 'admin';
}
