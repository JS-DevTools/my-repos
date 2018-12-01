import { POJOof } from "../util";

export type FetchResponse<T> = TypedResponse<T> | ErrorResponse;

export interface UntypedResponse {
  ok: boolean;
  error?: Error;
  status: number;
  statusText: string;
  url: string;
  headers: Readonly<POJOof<string>>;
  rawBody: unknown;
}

export interface TypedResponse<T> extends UntypedResponse {
  ok: true;
  error: undefined;
  body: T;
}

export interface ErrorResponse extends UntypedResponse {
  ok: false;
  error: Error;
}
