// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
export const LOCAL_DEV_MODE = location.hostname === "localhost";

export interface POJOof<T> {
  [key: string]: T;
}

export interface POJO extends POJOof<unknown> { }

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

// @ts-ignore - Typescript complains that T is implicitly any
type IdentityFunction<T> = (T) => unknown;

/**
 * Returns the unique items in both arrays, as determined by the specified identity function
 */
export function union<T>(array1: Iterable<T>, array2: Iterable<T>, identity: IdentityFunction<T> = (x: unknown) => x): T[] {
  let uniques: T[] = [];
  let ids = [];

  for (let array of [array1, array2]) {
    for (let item of array) {
      let id = identity(item);
      let alreadyExists = ids.includes(id);

      if (!alreadyExists) {
        ids.push(id);
        uniques.push(item);
      }
    }
  }

  return uniques;
}
