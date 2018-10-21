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


  public include(owner: string, repo: string = ""): void {
    let fullName = repo ? `${owner}/${repo}` : owner;

    let includedRepos = this._query.getAll("include");
    let excludedRepos = this._query.getAll("exclude");

    // Is this repo currently excluded?
    if (excludedRepos.some((excluded) => isSameRepo(excluded, fullName))) {
      // Delete the "exclude" list (there's no method to remove a single item from it)
      this._query.delete("exclude");

      // Re-create the "exclude" list without this repo
      for (let excludedRepo of excludedRepos) {
        if (!isSameRepo(excludedRepo, fullName)) {
          this._query.append("exclude", excludedRepo);
        }
      }
    }

    if (!includedRepos.includes(fullName)) {
      this._query.append("include", fullName);
    }
  }


  public exclude(owner: string, repo: string): void {
    // TODO
  }


  public toString() {
    this._query.sort();
    return this._query.toString();
  }
}


function isSameRepo(repoA: string, repoB: string): boolean {
  return repoA.toLowerCase() === repoB.toLowerCase();
}


export const params = new Params();
