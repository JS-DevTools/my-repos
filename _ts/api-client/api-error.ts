import { prettify } from "../util";

export class ApiError extends Error {
  public readonly url: string;

  public constructor(url: string, message: string, responseBody?: unknown) {
    message = `${url} ${message}`;

    if (responseBody !== undefined) {
      message += `\n${prettify(responseBody)}`;
    }

    super(message);
    this.url = url;
  }
}
