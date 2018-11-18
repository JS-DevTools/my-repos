import { stateStore } from "../state-store";
import { mapToPOJO, POJOof, random } from "../util";
import { ApiResponse, ResponseMapper } from "./api-response";

interface CachedResponse {
  status: number;
  statusText: string;
  headers: POJOof<string>;
  body: string;
}

/**
 * A wrapper around the Fetch API, with automatic response parsing, error-handling, and network latency immitation.
 */
export class ApiClient {
  /**
   * Sends the given HTTP Request, and maps the response to the desired data type using the given
   * mapper function.
   */
  public async fetch<T>(request: Request, mapper: ResponseMapper<T>): Promise<ApiResponse<T>> {
    let [response] = await Promise.all([
      await this._fetch<T>(request, mapper),
      artificialDelay(),
    ]);

    return response;
  }

  /**
   * Fetches the requested HTTP resource from the LocalStorage cache if possible.
   * If there is no cached response, then perform a real HTTP fetch.
   * This helps avoid hitting API rate limits.
   */
  private async _fetch<T>(request: Request, mapper: ResponseMapper<T>): Promise<ApiResponse<T>> {
    let fromCache: boolean;

    // Try to get the response from the cache first
    let rawResponse = this._fetchFromCache(request);

    if (rawResponse) {
      fromCache = true;
    }
    else {
      fromCache = false;

      // Unable to retrieve from cache, so perform a real HTTP fetch
      rawResponse = await fetch(request);

      if (rawResponse.ok) {
        // Cache the raw Response
        await this._cacheResponse(rawResponse);
      }
    }

    // Convert teh raw Fetch Response to an ApiResponse
    return ApiResponse.fromRaw<T>(rawResponse, fromCache, mapper);
  }

  /**
   * Returns the specified HTTP resource from the LocalStorage cache, if it exists.
   */
  private _fetchFromCache(request: Request): Response | undefined {
    // See if we have a cached response for this resource
    let cache = localStorage.getItem(request.url);

    if (cache) {
      try {
        // Re-hydrate the cached Fetch Response object
        let { body, ...init } = JSON.parse(cache) as CachedResponse;
        return new Response(body as string, init);
      }
      catch (error) {
        // The cached response is invalid, so delete it from LocalStorage
        localStorage.removeItem(request.url);
      }
    }
  }

  /**
   * Caches the given response
   */
  private async _cacheResponse(response: Response) {
    // Convert the response to a POJO that can be serialized as JSON
    let responsePOJO: CachedResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: mapToPOJO(response.headers as any),    // tslint:disable-line:no-any
      body: await response.clone().text(),
    };

    // Cache the response POJO as JSON in LocalStorage
    localStorage.setItem(response.url, JSON.stringify(responsePOJO, undefined, 2));
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
