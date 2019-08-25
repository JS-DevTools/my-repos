// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
export const LOCAL_DEV_MODE = location.hostname === "localhost";

// In "local dev" mode, artificially delay fetch requests by up to 1 second
// to simulate internet latency.
export const DEFAULT_DELAY = LOCAL_DEV_MODE ? 1000 : 0;

// In "local dev" mode, used cached content for 30 minutes,
// rather than re-fetching every time.
export const DEFAULT_CACHE_DURATION = LOCAL_DEV_MODE ? (1000 * 60 * 30) : 0;

export interface POJOof<T> {
  [key: string]: T;
}

// tslint:disable-next-line: no-any
export interface POJO extends POJOof<any> { }

export interface JsonPOJO extends POJOof<string | number | boolean | JsonPOJO | JsonPOJO[]> { }

/**
 * Returns the given value as a pretty-formatted string
 */
export function prettify(value: unknown): string {
  if (value && typeof value === "object") {
    return JSON.stringify(value, undefined, 2);
  }
  else {
    return String(value);
  }
}

/**
 * Returns a random number between min and max, inclusive.
 */
export function random(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a CSS class string that indicates the number of accounts.
 */
export function accountCountCssClass(accounts: ReadonlyArray<unknown>): string {
  switch (accounts.length) {
    case 0:
      return "no-accounts";
    case 1:
      return "has-accounts has-one-account";
    default:
      return "has-accounts has-multiple-accounts";
  }
}

/**
 * Used to find GitHub accounts by their "login" property
 */
export function byLogin(login: string) {
  login = login.trim().toLowerCase();
  return (account: { login: string }) => account.login.trim().toLowerCase() === login;
}

/**
 * Used to find GitHub repos by their "name" property
 */
export function byName(full_name: string) {
  full_name = full_name.trim().toLowerCase();
  return (repo: { full_name: string }) => repo.full_name.trim().toLowerCase() === full_name;
}
