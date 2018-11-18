import { mapToPOJO, POJOof } from "../util";
import { ApiError } from "./api-error";

export type ResponseMapper<T> = (responseBody: unknown) => T;

/**
 * A Fetch Response object with a typed body
 */
export class ApiResponse<T> {
  public readonly ok!: boolean;
  public readonly error?: Error;
  public readonly status!: number;
  public readonly statusText!: string;
  public readonly url!: string;
  public readonly fromCache!: boolean;
  public readonly headers!: Readonly<POJOof<string>>;
  public readonly body?: T;

  /**
   * Creates an ApiResponse object from the given Fetch Response body
   */
  public static async fromRaw<T>(rawResponse: Response, fromCache: boolean, mapper: ResponseMapper<T>): Promise<ApiResponse<T>> {
    let { ok, url, status, statusText } = rawResponse;
    let error: Error | undefined;
    let body: T | undefined;
    let headers: POJOof<string> = {};

    try {
      // Parse the headers, even if it's an error response
      headers = mapToPOJO(rawResponse.headers as any);    // tslint:disable-line:no-any

      // Parse the body, even if it's an error response, since the body may contain error details
      let rawBody = await parseResponseBody(rawResponse);

      if (ok) {
        // Try to map the response body to the desired type
        body = mapper(rawBody);
      }
      else {
        error = new ApiError(url, `returned an HTTP ${status} (${statusText || "Error"}) response`, rawBody);
      }
    }
    catch (err) {
      error = err as Error;
    }

    // If an error occurred, then the response is not OK
    ok = ok && !error;

    return new ApiResponse<T>({ ok, error, status, statusText, url, fromCache, headers, body });
  }

  public constructor(props: ApiResponse<T>) {
    Object.assign(this, props);
  }
}


async function parseResponseBody(rawResponse: Response): Promise<unknown> {
  try {
    // Try parsing the response as JSON first
    return await rawResponse.clone().json() as unknown;
  }
  catch (error) {
    // Unable to parse as JSON
  }

  try {
    // Try parsing the response as text
    return await rawResponse.clone().text();
  }
  catch (error) {
    // Unable to parse as Text
  }

  return undefined;
}
