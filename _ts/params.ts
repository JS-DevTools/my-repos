class Params {
  public isNew: boolean;
  private _query = new URLSearchParams(location.search);


  public constructor() {
    // If the params are empty when the page first loads, then we're building a new dashboard,
    // rather than showing or editing an existing one
    this.isNew = this.isEmpty;
  }


  public get isEmpty(): boolean {
    return !this._query.has("include");
  }


  public toString() {
    this._query.sort();
    return this._query.toString();
  }
}

/**
 * Singleton reference to the page's query params
 */
export const params = new Params();
