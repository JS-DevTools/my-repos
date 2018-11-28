import { POJOof } from "../util";
import { ApiError } from "./api-error";
import { ApiErrorResponse, ApiResponse, MappedApiResponse, UnmappedApiResponse } from "./api-response";

export type ResponseMapper<T> = (response: UnmappedApiResponse) => MappedApiResponse<T>;

/**
 * Maps a raw Fetch Response to a typed ApiResponse, if possible.
 * Otherwise, returns an ApiErrorResponse.
 */
export async function mapResponse<T>(rawResponse: Response, mapper: ResponseMapper<T>)
  : Promise<Readonly<ApiResponse<T>>> {

  let { ok, status, statusText, url } = rawResponse;
  let apiResponse: Partial<UnmappedApiResponse> = { ok, status, statusText, url };

  try {
    // Parse the headers, even if it's an error response
    apiResponse.headers = headersToPOJO(rawResponse.headers);

    // Parse the body, even if it's an error response, since the body may contain error details
    apiResponse.rawBody = await parseResponseBody(rawResponse);

    if (apiResponse.ok) {
      // Map the response body to the desired format
      let mappedApiResponse = mapper(apiResponse as UnmappedApiResponse);
      return mappedApiResponse;
    }
    else {
      apiResponse.error = new ApiError(
        url, `returned an HTTP ${status} (${statusText || "Error"}) response`, apiResponse.rawBody);
    }
  }
  catch (err) {
    apiResponse.error = err as Error;
  }

  // If we get here, then an error occurred
  apiResponse.ok = false;
  return apiResponse as ApiErrorResponse;
}

/**
 * Converts a Fetch Headers object into a simple POJO with string keys and values
 */
export function headersToPOJO(headers: Headers): POJOof<string> {
  let pojo = {} as POJOof<string>;

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
