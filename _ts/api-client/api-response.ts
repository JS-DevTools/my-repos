import { POJOof } from "../util";

export type ApiResponse<T> = MappedApiResponse<T> | ApiErrorResponse;

export interface UnmappedApiResponse {
  ok: boolean;
  error?: Error;
  status: number;
  statusText: string;
  url: string;
  headers: Readonly<POJOof<string>>;
  rawBody: unknown;
}

export interface MappedApiResponse<T> extends UnmappedApiResponse {
  ok: true;
  error: undefined;
  body: T;
}

export interface ApiErrorResponse extends UnmappedApiResponse {
  ok: false;
  error: Error;
}
