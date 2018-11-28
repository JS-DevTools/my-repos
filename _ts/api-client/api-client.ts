import { stateStore } from "../state-store";
import { random } from "../util";
import { ApiResponse } from "./api-response";
import { mapResponse, ResponseMapper } from "./map-response";

/**
 * A wrapper around the Fetch API, with automatic response parsing, error-handling, and network latency immitation.
 */
export class ApiClient {
  /**
   * Sends the given HTTP Request, and maps the response to the desired format using the given
   * mapper function.
   *
   * NOTE: Unlike the native Fetch API, this will never throw an error.  If an error occurs, then
   * the `ApiResponse.error` property will be set.
   */
  public async fetch<T>(request: Request, mapper: ResponseMapper<T>): Promise<Readonly<ApiResponse<T>>> {
    let [response] = await Promise.all([
      await this._fetch<T>(request, mapper),
      artificialDelay(),
    ]);

    return response;
  }

  private async _fetch<T>(request: Request, mapper: ResponseMapper<T>): Promise<Readonly<ApiResponse<T>>> {
    try {
      let rawResponse = await fetch(request);

      // Convert teh raw Fetch Response to an ApiResponse
      return mapResponse(rawResponse, mapper);
    }
    catch (error) {
      // Create a dummy response and set the `error` property
      let rawResponse = new Response(
        (error as Error).message,
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "text/plain",
          }
        }
      );

      return mapResponse(rawResponse, mapper);
    }
  }
}

/**
 * Introduces an artificial delay during local development.
 */
async function artificialDelay(): Promise<void> {
  let milliseconds = 0;

  if (stateStore.state.delay) {
    milliseconds = random(0, stateStore.state.delay);
  }

  await new Promise<unknown>((resolve) => setTimeout(resolve, milliseconds));
}
