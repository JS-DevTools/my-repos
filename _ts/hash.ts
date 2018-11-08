
export interface Options {
  /**
   * Whether to show forked repos on the dashboard
   */
  forks: boolean;
}

/**
 * Reads and stores state in the URL hash
 */
export class Hash {
  /**
   * The accounts to show on the dashboard
   */
  public accounts: Set<string>;

  /**
   * Specific repos to hide
   */
  public hide: Set<string>;

  public options: Options;

  public constructor() {
    let params = new URLSearchParams(location.hash.substr(1));
    this.accounts = parseStringSet(params.get("u"));
    this.hide = parseStringSet(params.get("hide"));
    this.options = {
      forks: parseBoolean(params.get("forks"))
    };
  }

  /**
   * Updates the URL hash to include the specified GitHub account
   */
  public addAccount(name: string) {
    this.accounts.add(name);
    this._updateHash();
  }

  /**
   * Updates the URL hash to remove the specified GitHub account
   */
  public removeAccount(name: string) {
    this.accounts.delete(name);
    this._updateHash();
  }

  /**
   * Updates the URL hash to hide or show the specified GitHub repo
   */
  public toggleRepo(full_name: string, hidden: boolean) {
    if (hidden) {
      this.hide.add(full_name);
    }
    else {
      this.hide.delete(full_name);
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
   * Updates the URL hash to match the properties of this object
   */
  private _updateHash() {
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

    location.hash = hashString;
  }
}

/**
 * The singleton instance of the Hash class.
 */
export const hash = new Hash();

function parseStringSet(value: string | null): Set<string> {
  if (!value) {
    return new Set();
  }
  else {
    return new Set(value.split(","));
  }
}

function parseBoolean(value: string | null): boolean {
  if (!value) {
    return false;
  }
  else {
    return ["yes", "true", "on", "ok"].includes(value.toLowerCase());
  }
}
