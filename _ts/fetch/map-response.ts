import { POJOof } from "../util";
import { FetchError } from "./fetch-error";
import { ErrorResponse, FetchResponse, TypedResponse, UntypedResponse } from "./fetch-response";

export type ResponseMapper<T> = (response: UntypedResponse) => TypedResponse<T>;

/**
 * Maps a raw Fetch Response to a TypedResponse, if possible.
 * Otherwise, returns an ErrorResponse.
 */
export async function mapResponse<T>(rawResponse: Response, mapper: ResponseMapper<T>): Promise<Readonly<FetchResponse<T>>> {
  let { ok, status, statusText, url } = rawResponse;
  let untypedResponse: Partial<UntypedResponse> = { ok, status, statusText, url };

  try {
    // Parse the headers, even if it's an error response
    untypedResponse.headers = headersToPOJO(rawResponse.headers);

    // Parse the body, even if it's an error response, since the body may contain error details
    untypedResponse.rawBody = await parseResponseBody(rawResponse);

    if (untypedResponse.ok) {
      // Map the response body to the desired format
      let typedResponse = mapper(untypedResponse as UntypedResponse);
      return typedResponse;
    }
    else {
      untypedResponse.error = new FetchError(
        url, `returned an HTTP ${status} (${statusText || "Error"}) response`, untypedResponse.rawBody);
    }
  }
  catch (err) {
    untypedResponse.error = err as Error;
  }

  // If we get here, then an error occurred
  untypedResponse.ok = false;
  return untypedResponse as ErrorResponse;
}

/**
 * Converts a Fetch Headers object into a simple POJO with string keys and values
 */
export function headersToPOJO(headers: Headers): POJOof<string> {
  let pojo: POJOof<string> = {};

  for (let [key, value] of headers.entries()) {
    pojo[key.toLowerCase()] = value;
  }

  return pojo;
}

/**
 * Parses a Fetch Response body, either as JSON or plain text
 */
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
