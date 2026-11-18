// Response envelopes of the API (`{ success, data }` / `{ success, message }`).
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

// List contract: forward-only cursor, no total count.
export type ListMeta = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type ApiList<T> = {
  success: true;
  data: T[];
  meta: ListMeta;
};

export type ApiFieldError = {
  path?: string;
  message: string;
  code?: string;
};

export type ApiFailure = {
  success: false;
  // Already translated by the API (X-Lang header).
  message: string;
  code?: string;
  errors?: ApiFieldError[];
};
