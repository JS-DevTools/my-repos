import { hash } from "./hash";
import { LOCAL_DEV_MODE, mapToPOJO, random } from "./util";

interface JsonPojo {
  [key: string]: string | number | boolean | JsonPojo | JsonPojo[];
}

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export type ParsedResponseBody = string | JsonPojo | JsonPojo[] | undefined;

export type CachedResponse = ResponseInit & { body: string };

/**
 * A wrapper around the Fetch API, with added error handling and automatic response parsing.
 */
export class ApiClient {
  /**
   * Returns the parsed response, or throws an error if an error response is returned
   */
  public async fetch(input: RequestInfo, init?: RequestInit): Promise<ParsedResponseBody> {
    let [response] = await Promise.all([
      await fetchWithFallback(input, init),
      artificialDelay(),
    ]);

    // Parse the response, even if it's an error, since the body may contain error details
    let parsedResponseBody = await parseResponseBody(response);

    if (!response.ok) {
      throw this.createError(
        `${getUrl(input)} returned an HTTP ${response.status} (${response.statusText || "Error"}) response`,
        parsedResponseBody
      );
    }

    await cacheResponse(input, response);
    return parsedResponseBody;
  }

  /**
   * Returns the parsed response if it's a valid JSON array; otherwise, or throws an error.
   */
  public async fetchArray(input: RequestInfo, init?: RequestInit): Promise<JsonPojo[]> {
    let parsedResponseBody = await this.fetch(input, init);

    if (!Array.isArray(parsedResponseBody)) {
      throw this.createError(
        `${getUrl(input)} did not return a JSON array as expected`,
        parsedResponseBody
      );
    }

    return parsedResponseBody;
  }

  /**
   * Returns the parsed response if it's a valid JSON object; otherwise, or throws an error.
   */
  public async fetchObject(input: RequestInfo, init?: RequestInit): Promise<JsonPojo> {
    let parsedResponseBody = await this.fetch(input, init);

    if (typeof parsedResponseBody !== "object") {
      throw this.createError(
        `${getUrl(input)} did not return a JSON object as expected`,
        parsedResponseBody
      );
    }
    else if (Array.isArray(parsedResponseBody)) {
      throw this.createError(
        `${getUrl(input)} returned a JSON array, but a JSON object was expected`,
        parsedResponseBody
      );
    }

    return parsedResponseBody;
  }

  /**
   * Creates an Error with the specified message, including the parsed response body
   */
  public createError(message: string, parsedResponseBody: ParsedResponseBody): Error {
    return new Error(message + "\n" + JSON.stringify(parsedResponseBody, undefined, 2));
  }
}


/**
 * Fetches the requested HTTP resource, but falls-back to a previously-cached copy
 * from LocalStorage, if necessary.
 */
async function fetchWithFallback(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let primary: Fetch, secondary: Fetch;

  if (LOCAL_DEV_MODE) {
    // For local development, default to LocalStorage to avoid hitting API rate limits
    primary = fetchFromCache;
    secondary = fetch;
  }
  else {
    // In production, hit the API first, but fallback to LocalStorage if necessary
    primary = fetch;
    secondary = fetchFromCache;
  }

  let response = await primary(input, init);

  if (response.ok) {
    return response;
  }
  else {
    return secondary(input, init);
  }
}

/**
 * Fetches the requested resource from LocalStorage cache
 */
async function fetchFromCache(input: RequestInfo): Promise<Response> {
  // Default response (for a cache miss)
  let responsePOJO: CachedResponse = {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": "0",
    },
    body: "",
  };

  // See if we have a cached response for this resource
  let cache = localStorage.getItem(getUrl(input));
  if (cache) {
    try {
      responsePOJO = JSON.parse(cache) as CachedResponse;
    }
    catch (error) {
      responsePOJO.body = (error as Error).message;
    }
  }

  // Convert the response POJO into a real Fetch Response
  return new Response(responsePOJO.body, responsePOJO);
}

/**
 * Caches the given response for the specified HTTP resource
 */
async function cacheResponse(input: RequestInfo, response: Response) {
  // Convert the response to a POJO that can be cached
  let responsePOJO: CachedResponse = {
    status: response.status,
    statusText: response.statusText,
    headers: mapToPOJO(response.headers as any),   // tslint:disable-line:no-any
    body: await response.clone().text(),
  };

  // Cache the response POJO as JSON in LocalStorage
  localStorage.setItem(getUrl(input), JSON.stringify(responsePOJO, undefined, 2));
}

/**
 * Returns the URL from the given RequestInfo value
 */
function getUrl(input: RequestInfo): string {
  return typeof input === "string" ? input : input.url;
}

/**
 * Tries to parse the response as JSON, but falls back to text if that fails
 */
async function parseResponseBody(response: Response): Promise<ParsedResponseBody> {
  let responseBody: string;

  try {
    responseBody = await response.clone().text();
  }
  catch (error) {
    // The response could not be read
    return undefined;
  }

  try {
    // Try to parse the response as JSON
    let parsedResponseBody = JSON.parse(responseBody) as ParsedResponseBody;

    if (typeof parsedResponseBody === "object") {
      // Return the parsed object or array
      return parsedResponseBody;
    }
    else {
      // Coerce the result to a string
      return String(parsedResponseBody);
    }
  }
  catch (error) {
    // The response couldn't be parsed as JSON, so just return it as a string
    return responseBody;
  }
}

/**
 * Introduces an artificial delay during local development.
 */
async function artificialDelay(): Promise<void> {
  let milliseconds = 0;

  if (hash.options.delay) {
    milliseconds = random(0, hash.options.delay);
  }

  await new Promise<unknown>((resolve) => setTimeout(resolve, milliseconds));
}
