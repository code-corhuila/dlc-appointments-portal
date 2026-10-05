export interface PageMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface Page<T> {
  readonly data: readonly T[];
  readonly meta: PageMeta;
}