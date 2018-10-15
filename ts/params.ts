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


  public include(repoName: string): void {
    let includedRepos = this._query.getAll("include");
    let excludedRepos = this._query.getAll("exclude");

    if (excludedRepos.includes(repoName)) {
      // Remove this repo from the exclude list
      this._query.delete("exclude");
      for (let excludedRepo of excludedRepos) {
        if (excludedRepo !== repoName) {
          this._query.append("exclude", excludedRepo);
        }
      }
    }

    if (!includedRepos.includes(repoName)) {
      this._query.append("include", repoName);
    }
  }


  public exclude(repoName: string): void {
    // TODO
  }


  public toString() {
    this._query.sort();
    return this._query.toString();
  }
}


export const params = new Params();
