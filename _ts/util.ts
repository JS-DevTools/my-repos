// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
export const LOCAL_DEV_MODE = location.hostname === "localhost";

// The default delay, based on whether we're in "local dev" mode
export const DEFAULT_DELAY = LOCAL_DEV_MODE ? 1000 : 0;

// PetitDom doesn't support null elements, so we have to use an empty string instead
export const NULL = "";

export interface POJOof<T> {
  [key: string]: T;
}

export interface POJO extends POJOof<unknown> { }

export interface JsonPOJO extends POJOof<string | number | boolean | JsonPOJO | JsonPOJO[]> { }

/**
 * Converts a Map-like object to a POJO with string keys
 */
export function mapToPOJO<K, V>(map: Map<K, V>): POJOof<V> {
  let pojo = {} as POJOof<V>;

  for (let [key, value] of map.entries()) {
    pojo[key.toString()] = value;
  }

  return pojo;
}

/**
 * Returns the given value as a pretty-formatted string
 */
export function prettify(value: unknown): string {
  // tslint:disable-next-line:strict-type-predicates
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
 * Returns the `login` property of the given object
 */
export function getLogin(obj: { login: string }): string {
  return obj.login;
}
