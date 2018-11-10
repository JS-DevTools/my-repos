import { LOCAL_DEV_MODE } from "./util";

// Artificially delay AJAX calls for local development, to simulate network latency
const defaultDelay = LOCAL_DEV_MODE ? 1000 : 0;

export interface Options {
  /**
   * Whether to show forked repos on the dashboard
   */
  forks: boolean;

  /**
   * Delays AJAX responses by a number of milliseconds.
   * This is mostly just used for local development, to simulate network latency.
   */
  delay: number;
}

/**
 * Reads and stores state in the URL hash
 */
export class Hash extends EventTarget {
  private readonly _accounts: Set<string> = new Set();
  private readonly _hide: Set<string> = new Set();
  private readonly _options: Options = {
    forks: false,
    delay: defaultDelay,
  };

  /**
   * The accounts to show on the dashboard
   */
  public readonly accounts: ReadonlySet<string> = this._accounts;

  /**
   * Specific repos to hide
   */
  public readonly hide: ReadonlySet<string> = this._hide;

  /**
   * Options for how the dashboard should be displayed
   */
  public readonly options: Readonly<Options> = this._options;

  public constructor() {
    super();
    this._handleHashChange();
    window.addEventListener("hashchange", () => this._handleHashChange());
  }

  /**
   * Updates the URL hash to include the specified GitHub account
   */
  public addAccount(name: string) {
    this._accounts.add(name);
    this._updateHash();
  }

  /**
   * Updates the URL hash to remove the specified GitHub account
   */
  public removeAccount(name: string) {
    this._accounts.delete(name);
    this._updateHash();
  }

  /**
   * Updates the URL hash to hide or show the specified GitHub repo
   */
  public toggleRepo(full_name: string, hidden: boolean) {
    if (hidden) {
      this._hide.add(full_name);
    }
    else {
      this._hide.delete(full_name);
    }

    this._updateHash();
  }

  /**
   * Updates the URL hash to with the specified options
   */
  public setOptions(options: Partial<Options>) {
    Object.assign(this.options, options);
    this._updateHash();
  }

  /**
   * Returns a URL hash string that matches the Hash object
   */
  public toString() {
    let params = new URLSearchParams();

    if (this.accounts.size > 0) {
      params.append("u", [...this.accounts].join(","));
    }

    if (this.hide.size > 0) {
      params.append("hide", [...this.hide].join(","));
    }

    if (this.options.forks) {
      params.append("forks", "yes");
    }

    if (this.options.delay && this.options.delay !== defaultDelay) {
      params.append("delay", String(this.options.delay));
    }

    let hashString = params.toString();

    // Don't encode common characters that are valid in the hash
    hashString = hashString.replace(/%2C/g, ",");
    hashString = hashString.replace(/%2F/g, "/");

    return hashString;
  }

  /**
   * Updates the URL hash to match the Hash object
   */
  private _updateHash() {
    location.hash = this.toString();
  }

  /**
   * Updates the Hash object to match the URL hash
   */
  private _handleHashChange() {
    let actualHash = location.hash.substr(1);
    let expectedHash = this.toString();

    if (actualHash !== expectedHash) {
      let params = new URLSearchParams(location.hash.substr(1));

      parseStringSet(params.get("u"), this._accounts);
      parseStringSet(params.get("hide"), this._hide);
      this._options.forks = parseBoolean(params.get("forks"), this._options.forks);
      this._options.delay = parsePositiveInteger(params.get("delay"), this._options.delay);

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
function parseStringSet(value: string | null, set: Set<string>) {
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
