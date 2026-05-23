import type { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  return { page, limit, offset: (page - 1) * limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
