
export interface Options {
  /**
   * Whether to show forked repos on the dashboard
   */
  forks: boolean;
}

/**
 * Reads and stores state in the URL hash
 */
export class Hash extends EventTarget {
  private readonly _accounts = new Set();
  private readonly _hide = new Set();
  private readonly _options = {
    forks: false,
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
    if (location.hash !== this.toString()) {
      let params = new URLSearchParams(location.hash.substr(1));
      parseStringSet(params.get("u"), this._accounts);
      parseStringSet(params.get("hide"), this._hide);
      this._options.forks = parseBoolean(params.get("forks"));
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
      set.add(string);
    }
  }
}

/**
 * Parses a boolean string
 */
function parseBoolean(value: string | null): boolean {
  if (!value) {
    return false;
  }
  else {
    return ["yes", "true", "on", "ok"].includes(value.toLowerCase());
  }
}
