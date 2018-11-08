interface JsonPojo {
  [key: string]: string | number | boolean | JsonPojo | JsonPojo[];
}

export type ParsedResponseBody = string | JsonPojo | JsonPojo[] | undefined;

/**
 * A wrapper around the Fetch API, with added error handling and automatic response parsing.
 */
export class ApiClient {
  /**
   * Returns the parsed response, or throws an error if an error response is returned
   */
  public async fetch(input: RequestInfo, init?: RequestInit): Promise<ParsedResponseBody> {
    let response = await fetch(input, init);
    let parsedResponseBody = await parseResponseBody(response);

    if (!response.ok) {
      throw this.createError(
        `${getUrl(input)} returned an HTTP ${response.status} (${response.statusText || "Error"}) response`,
        parsedResponseBody
      );
    }

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
    responseBody = await response.text();
  }
  catch (error) {
    // The response could not be read
    return undefined;
  }

  try {
    // Try to parse the response as JSON
    let parsedResponseBody = JSON.parse(responseBody);

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
