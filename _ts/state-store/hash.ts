import { DEFAULT_DELAY, getLogin } from "../util";
import { ReadonlyAppState } from "./app-state";

export interface HashAccount {
  login: string;
  name: string;
}

export interface HashState {
  accounts: HashAccount[];
  hiddenRepos: Set<string>;
  showForks: boolean;
  showArchived: boolean;
  delay: number;
}

/**
 * Updates the URL hash to match the specified app state
 */
export function writeStateToHash(state: Partial<ReadonlyAppState>) {
  let hash = stateToHash(state);
  let currentHash = location.hash.substr(1);
  if (hash !== currentHash) {
    location.hash = hash;
  }
}

/**
 * Returns an AppState instance that matches the current URL hash
 */
export function readStateFromHash(): HashState {
  let hash = location.hash.substr(1);
  let state = hashToState(hash);
  return state;
}

/**
 * Determines whether the current URL hash matches the specified app state
 */
export function hashMatchesState(state: Partial<ReadonlyAppState>): boolean {
  let actualHash = location.hash.substr(1);
  let expectedHash = stateToHash(state);
  return actualHash === expectedHash;
}

/**
 * Serializes the specified app state as a URL hash string
 */
function stateToHash(state: Partial<ReadonlyAppState>): string {
  let params = new URLSearchParams();

  if (state.accounts && state.accounts.length > 0) {
    params.append("u", state.accounts.map(getLogin).join(","));
  }

  if (state.hiddenRepos && state.hiddenRepos.size > 0) {
    params.append("hide", [...state.hiddenRepos].sort().join(","));
  }

  if (state.showForks) {
    params.append("forks", "yes");
  }

  if (state.showArchived) {
    params.append("archived", "yes");
  }

  if (state.delay !== DEFAULT_DELAY) {
    params.append("delay", String(state.delay));
  }

  let hashString = params.toString();

  // Don't encode common characters that are valid in the hash
  hashString = hashString.replace(/%2C/g, ",");
  hashString = hashString.replace(/%2F/g, "/");

  return hashString;
}

/**
 * Deserializes an AppState instance from the specified URL hash string
 */
function hashToState(hash: string): HashState {
  let params = new URLSearchParams(hash);
  let state: HashState = {
    accounts: parseAccounts(params.get("u")),
    hiddenRepos: parseStringSet(params.get("hide")),
    showForks: parseBoolean(params.get("forks")),
    showArchived: parseBoolean(params.get("archived")),
    delay: parsePositiveInteger(params.get("delay"), DEFAULT_DELAY),
  };
  return state;
}

/**
 * Parses a comma-delimited string as an array of GitHub accounts
 */
function parseAccounts(value: string | null): HashAccount[] {
  let logins = parseStringSet(value);
  let accounts: HashAccount[] = [];

  for (let login of logins.values()) {
    accounts.push({
      login,
      name: login,
    });
  }

  return accounts;
}

/**
 * Parses a comma-delimited string as a Set of strings
 */
function parseStringSet(value: string | null): Set<string> {
  value = value ? value.trim() : "";
  let set = new Set<string>();

  if (value) {
    let strings = value.split(",");
    for (let string of strings) {
      string = string.trim();
      if (string.length > 0) {
        set.add(string);
      }
    }
  }

  return set;
}

/**
 * Parses a boolean string
 */
function parseBoolean(value: string | null, defaultValue = false): boolean {
  value = value ? value.trim() : "";
  let boolean = ["yes", "true", "on", "ok", "show"].includes(value.toLowerCase());
  if (boolean === defaultValue) {
    return defaultValue;
  }
  else {
    return boolean;
  }
}

/**
 * Parses a numeric string.  It can be a float or integer, positive or negative.
 */
function parseNumber(value: string | null, defaultValue = 0): number {
  value = value ? value.trim() : "";
  let number = parseFloat(value);
  if (isNaN(number) || number === defaultValue) {
    return defaultValue;
  }
  else {
    return number;
  }
}

/**
 * Parses an integer string.  It can be positive or negative.
 */
function parseInteger(value: string | null, defaultValue = 0): number {
  value = value ? value.trim() : "";
  let number = parseNumber(value, defaultValue);
  number = Number.isSafeInteger(number) ? number : Math.round(number);
  if (number === defaultValue) {
    return defaultValue;
  }
  else {
    return number;
  }
}

/**
 * Parses a positive integer string.  It can be positive or zero.
 */
function parsePositiveInteger(value: string | null, defaultValue = 0): number {
  value = value ? value.trim() : "";
  let number = parseInteger(value, defaultValue);
  if (number < 0 || number === defaultValue) {
    return defaultValue;
  }
  else {
    return number;
  }
}
