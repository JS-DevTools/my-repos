import { artificialDelay } from "./artificial-delay";
import { FetchResponse } from "./fetch-response";
import { mapResponse, ResponseMapper } from "./map-response";

/**
 * A wrapper around the Fetch API that returns strongly-typed responses.
 *
 * NOTE: This function will never throw an error.  If an error occurs, then an ErrorResponse is returned.
 */
export async function fetch<T>(request: Request | string, mapper: ResponseMapper<T>): Promise<Readonly<FetchResponse<T>>> {
  if (typeof request === "string") {
    request = new Request(request);
  }

  try {
    // Send the HTTP Request, and possibly simulate network latency
    let [rawResponse] = await Promise.all([
      window.fetch(request),
      artificialDelay(),
    ]);

    // Convert teh raw Fetch Response to an FetchResponse
    return mapResponse(rawResponse, mapper);
  }
  catch (error) {
    // Return an error response
    return {
      ok: false,
      error: error as Error,
      status: 503,
      statusText: "Service Unavailable",
      url: request.url,
      headers: {
        "content-type": "text/plain",
      },
      rawBody: (error as Error).message,
    };
  }
}
