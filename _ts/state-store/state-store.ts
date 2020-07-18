import { GitHubAccount, GitHubAccountKey } from "../github/github-account";
import { GitHubRepo, GitHubRepoKey } from "../github/github-repo";
import { byLogin, byName } from "../util";
import { AppState, ReadonlyAppState } from "./app-state";
import { Cache } from "./cache";
import { fetchData } from "./fetch-data";
import { hashMatchesState, readStateFromHash, writeStateToHash } from "./hash";

const hashchange = "hashchange";
const statechange = "statechange";

export class StateStore extends EventTarget {
  public readonly state: ReadonlyAppState = new AppState();
  private readonly _cache = new Cache();

  public constructor() {
    super();

    // Initialize the state from the URL hash
    this.syncWithHash();

    // Update the state whenever the hash changes
    window.addEventListener(hashchange, () => this.syncWithHash());
  }

  /**
   * Subscribes to the "statechange" event
   */
  public onStateChange(listener: (evt: CustomEvent) => void) {
    this.addEventListener(statechange, listener);
  }

  /**
   * Dispatches a "statechange" event
   */
  public setState(partialState: Partial<ReadonlyAppState>) {
    Object.assign(this.state, partialState);
    writeStateToHash(this.state);

    let stateChangeEvent = new CustomEvent<object>(statechange);
    this.dispatchEvent(stateChangeEvent);
  }

  /**
   * Updates the state to match the URL hash
   */
  public syncWithHash() {
    if (hashMatchesState(this.state)) {
      // The URL hash is already in-sync with the app state
      return;
    }

    let { accounts: hashAccounts, ...hashState } = readStateFromHash();

    // Re-order the accounts to match the hash order
    let accounts: GitHubAccount[] = [];

    for (let hashAccount of hashAccounts) {
      let account = this.state.accounts.find(byLogin(hashAccount.login));

      if (!account) {
        // This is a newly-added account. Get its data from the cache, if possible
        account = this._cache.getAccount(hashAccount);

        if (!account) {
          // Cache miss.  So create a skeleton GitHubAccount object
          account = new GitHubAccount(hashAccount);
        }

        // Start fetching the account's data from GitHub, David-DM, etc.
        account.loading = true;
        this._fetchData(account);
      }

      accounts.push(account);
    }

    this.setState({ accounts, ...hashState });
  }

  /**
   * Adds a new GitHub account with the specified login to the accounts list,
   * and asynchronously fetches the account info from GitHub
   */
  public addAccount({ login }: GitHubAccountKey) {
    login = login.trim();

    // Determine whether the account already exists
    let account = this.state.accounts.find(byLogin(login));
    if (account) {
      return;
    }

    // Get the account data from the cache, if possible
    account = this._cache.getAccount({ login });

    if (!account) {
      // Cache miss.  So create a skeleton GitHubAccount object
      account = new GitHubAccount({ login, name: login });
    }

    // Start fetching the account's data from GitHub, David-DM, etc.
    account.loading = true;
    this._fetchData(account);

    // Add this account
    let accounts = this.state.accounts.slice();
    accounts.push(account);
    this.setState({ accounts });
  }

  /**
   * Updates the specified GitHub account
   */
  public updateAccount(diff: GitHubAccountKey & Partial<GitHubAccount>) {
    if (!diff.login) {
      throw new Error("Account login must be specified when updating an account");
    }

    let accounts = this.state.accounts.slice();
    let account = accounts.find(byLogin(diff.login));

    if (account) {
      Object.assign(account, diff);
      this._cache.setAccount(account);
      this.setState({ accounts });
    }
  }

  /**
   * Removes the specified GitHub account from the accounts list
   */
  public removeAccount(account: GitHubAccountKey) {
    let accounts = this.state.accounts.slice();
    let index = accounts.findIndex(byLogin(account.login));

    if (index >= 0) {
      accounts.splice(index, 1);
      this.setState({ accounts });
    }
  }

  /**
   * Updates the specified GitHub repo
   */
  public updateRepo(diff: GitHubRepoKey & Partial<GitHubRepo>) {
    if (!diff.login || !diff.full_name) {
      throw new Error("Account login and repo name must be specified when updating a repo");
    }

    let accounts = this.state.accounts.slice();
    let account = accounts.find(byLogin(diff.login));

    if (account) {
      let repo = account.repos.find(byName(diff.full_name));

      if (repo) {
        Object.assign(repo, diff);
        this._cache.setRepo(repo);
        this.setState({ accounts });
      }
    }
  }

  /**
   * Adds or removes the specified GitHub repo from the `hiddenRepos` list
   */
  public toggleHidden(repo: GitHubRepoKey, hidden: boolean) {
    let hiddenRepos = new Set(this.state.hiddenRepos);
    if (hidden) {
      hiddenRepos.add(repo.full_name);
    }
    else {
      hiddenRepos.delete(repo.full_name);
    }
    this.setState({ hiddenRepos });
  }

  /**
   * Fetchs all the data for the specified GitHub account from GitHub, David-DM, etc.
   * This function returns immediately, and the `updateAccount()` and `updateRepo()` callbacks
   * are called as data is received.
   */
  private _fetchData(account: GitHubAccount) {
    let updateAccount = this.updateAccount.bind(this);
    let updateRepo = this.updateRepo.bind(this);
    fetchData(account, updateAccount, updateRepo);
  }
}
