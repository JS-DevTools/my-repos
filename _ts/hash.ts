import { config } from "./config";

/**
 * Reads and stores the config settings in the URL hash
 */
export class Hash extends EventTarget {
  public constructor() {
    super();
    this._handleHashChange();
    window.addEventListener("hashchange", () => this._handleHashChange());
  }

  /**
   * Updates the URL hash to match the Config object
   */
  public updateHash() {
    location.hash = this.toString();
  }

  /**
   * Returns a URL hash string that matches the Config object
   */
  public toString() {
    let params = new URLSearchParams();

    if (config.accounts.size > 0) {
      params.append("u", [...config.accounts].join(","));
    }

    if (config.hiddenRepos.size > 0) {
      params.append("hide", [...config.hiddenRepos].join(","));
    }

    if (config.showForks) {
      params.append("forks", "yes");
    }

    if (config.showArchived) {
      params.append("archived", "yes");
    }

    if (config.delay && config.delay !== config.defaultDelay) {
      params.append("delay", String(config.delay));
    }

    let hashString = params.toString();

    // Don't encode common characters that are valid in the hash
    hashString = hashString.replace(/%2C/g, ",");
    hashString = hashString.replace(/%2F/g, "/");

    return hashString;
  }

  /**
   * Updates the Config object to match the URL hash
   */
  private _handleHashChange() {
    let actualHash = location.hash.substr(1);
    let expectedHash = this.toString();

    if (actualHash !== expectedHash) {
      let params = new URLSearchParams(location.hash.substr(1));

      config.accounts = parseStringSet(params.get("u"), config.accounts);
      config.hiddenRepos = parseStringSet(params.get("hide"), config.hiddenRepos);
      config.showForks = parseBoolean(params.get("forks"), config.showForks);
      config.showArchived = parseBoolean(params.get("archived"), config.showArchived);
      config.delay = parsePositiveInteger(params.get("delay"), config.delay);

      this.dispatchEvent(new Event("hashchange"));
    }
  }
}

/**
 * The singleton instance of the Hash class.
 */
export const hash = new Hash();

/**
 * Updates the contents of the given Set object to match the contents of
 * the specified comma-delimited string
 */
function parseStringSet(value: string | null, set: Set<string>): Set<string> {
  set.clear();

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
  if (!value) {
    return defaultValue;
  }
  else {
    return ["yes", "true", "on", "ok", "show"].includes(value.toLowerCase());
  }
}

/**
 * Parses a numeric string.  It can be a float or integer, positive or negative.
 */
function parseNumber(value: string | null, defaultValue = 0): number {
  let number = parseFloat(value!);
  return isNaN(number) ? defaultValue : number;
}

/**
 * Parses an integer string.  It can be positive or negative.
 */
function parseInteger(value: string | null, defaultValue = 0): number {
  let number = parseNumber(value, defaultValue);
  return Number.isSafeInteger(number) ? number : Math.round(number);
}

/**
 * Parses a positive integer string.  It can be positive or zero.
 */
function parsePositiveInteger(value: string | null, defaultValue = 0): number {
  let number = parseInteger(value, defaultValue);
  return number >= 0 ? number : defaultValue;
}
