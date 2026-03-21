/**
 * Builds a safe SQL ORDER BY + LIMIT + OFFSET clause.
 * Prevents SQL injection by whitelisting allowed sort columns.
 *
 * @param allowedColumns - Columns that are safe to sort by
 * @param sortBy         - Requested sort column (from query params)
 * @param sortOrder      - ASC or DESC
 * @param page           - 1-indexed page number
 * @param limit          - Items per page (capped at maxLimit)
 * @param maxLimit       - Absolute maximum (default 100)
 */
export function buildOrderClause(
  allowedColumns: readonly string[],
  sortBy: string | undefined,
  sortOrder: string | undefined,
  page: number,
  limit: number,
  maxLimit = 100,
): { orderBy: string; safePage: number; safeLimit: number; offset: number } {
  const safeColumn = allowedColumns.includes(sortBy ?? '')
    ? (sortBy as string)
    : allowedColumns[0]!;

  const safeOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), maxLimit);
  const offset = (safePage - 1) * safeLimit;

  return {
    orderBy: `${safeColumn} ${safeOrder}`,
    safePage,
    safeLimit,
    offset,
  };
}

/**
 * Extracts pagination params from an Express query object with safe defaults.
 */
export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  sortBy: string | undefined;
  sortOrder: 'ASC' | 'DESC';
  search: string | undefined;
} {
  return {
    page: Math.max(1, parseInt(String(query['page'] ?? '1'), 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(String(query['limit'] ?? '10'), 10) || 10)),
    sortBy: typeof query['sortBy'] === 'string' ? query['sortBy'] : undefined,
    sortOrder: query['sortOrder'] === 'ASC' ? 'ASC' : 'DESC',
    search: typeof query['search'] === 'string' && query['search'] ? query['search'] : undefined,
  };
}
