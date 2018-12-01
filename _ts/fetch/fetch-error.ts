import { prettify } from "../util";

export class FetchError extends Error {
  public readonly url: string;

  public constructor(url: string, message: string, responseBody?: unknown) {
    message = `${url} ${message}`;

    if (responseBody) {
      message += `\n${prettify(responseBody)}`;
    }

    super(message);
    this.url = url;
  }
}
