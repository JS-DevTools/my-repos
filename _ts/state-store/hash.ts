import { GitHubAccount } from "../github/github-account";
import { AppState, DEFAULT_DELAY, ReadonlyAppState } from "./app-state";

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
export function readStateFromHash(): Partial<AppState> {
  let hash = location.hash.substr(1);
  return hashToState(hash);
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
    params.append("u", [...state.accounts].join(","));
  }

  if (state.hiddenRepos && state.hiddenRepos.size > 0) {
    params.append("hide", [...state.hiddenRepos].join(","));
  }

  if (state.showForks) {
    params.append("forks", "yes");
  }

  if (state.showArchived) {
    params.append("archived", "yes");
  }

  if (state.delay && state.delay !== DEFAULT_DELAY) {
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
function hashToState(hash: string): Partial<AppState> {
  let params = new URLSearchParams(hash);
  let state: Partial<AppState> = {
    accounts: parseAccounts(params.get("u")),
    hiddenRepos: parseStringSet(params.get("hide")),
    showForks: parseBoolean(params.get("forks")),
    showArchived: parseBoolean(params.get("archived")),
    delay: parsePositiveInteger(params.get("delay")),
  };
  return state;
}

/**
 * Parses a comma-delimited string as an array of GitHub accounts
 */
function parseAccounts(value: string | null): GitHubAccount[] | undefined {
  let logins = parseStringSet(value);

  if (logins) {
    let accounts: GitHubAccount[] = [];

    for (let login of logins.values()) {
      accounts.push(new GitHubAccount({
        login,
        name: login,
      }));
    }

    return accounts;
  }
}

/**
 * Parses a comma-delimited string as a Set of strings
 */
function parseStringSet(value: string | null): Set<string> | undefined {
  value = value ? value.trim() : "";

  if (value) {
    let set = new Set<string>();

    let strings = value.split(",");
    for (let string of strings) {
      string = string.trim();
      if (string.length > 0) {
        set.add(string);
      }
    }

    return set;
  }
}

/**
 * Parses a boolean string
 */
function parseBoolean(value: string | null): boolean | undefined {
  value = value ? value.trim() : "";

  if (value) {
    return ["yes", "true", "on", "ok", "show"].includes(value.toLowerCase());
  }
}

/**
 * Parses a numeric string.  It can be a float or integer, positive or negative.
 */
function parseNumber(value: string | null): number | undefined {
  value = value ? value.trim() : "";
  let number = parseFloat(value);
  return isNaN(number) ? undefined : number;
}

/**
 * Parses an integer string.  It can be positive or negative.
 */
function parseInteger(value: string | null): number | undefined {
  value = value ? value.trim() : "";
  let number = parseNumber(value);

  if (typeof number === "number") {
    return Number.isSafeInteger(number) ? number : Math.round(number);
  }
}

/**
 * Parses a positive integer string.  It can be positive or zero.
 */
function parsePositiveInteger(value: string | null): number | undefined {
  value = value ? value.trim() : "";
  let number = parseInteger(value);

  if (typeof number === "number") {
    return number >= 0 ? number : undefined;
  }
}