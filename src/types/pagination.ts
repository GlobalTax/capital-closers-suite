/**
 * Tipos para paginación server-side
 */

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export const DEFAULT_PAGE_SIZE = 25;

export function calculatePagination(count: number, page: number, pageSize: number): Pick<PaginatedResult<any>, 'page' | 'pageSize' | 'totalPages' | 'count'> {
  return {
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}
