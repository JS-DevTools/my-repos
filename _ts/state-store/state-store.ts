import { GitHubAccount } from "../github/github-account";
import { GitHubRepo } from "../github/github-repo";
import { union } from "../util";
import { AppState, ReadonlyAppState } from "./app-state";
import { fetchGitHubAccount } from "./fetch-github-account";
import { hashMatchesState, readStateFromHash, writeStateToHash } from "./hash";

const hashchange = "hashchange";
const statechange = "statechange";

interface StateChangeEventDetail {
  state: Partial<ReadonlyAppState>;
  callback(): void;
}

export class StateStore extends EventTarget {
  public readonly state: ReadonlyAppState = new AppState();

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
  public onStateChange(listener: (evt: CustomEvent<StateChangeEventDetail>) => void) {
    this.addEventListener(statechange, listener);
  }

  /**
   * Dispatches a "statechange" event
   */
  public setState(partialState: Partial<ReadonlyAppState>, callback?: () => void) {
    Object.assign(this.state, partialState);

    let stateChangeEvent = new CustomEvent<StateChangeEventDetail>(statechange, {
      detail: {
        state: this.state,
        callback: () => {
          writeStateToHash(this.state);
          callback && callback(); //tslint:disable-line:no-void-expression
        }
      }
    });

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

    let hashState = readStateFromHash();
    let state = new AppState(this.state);

    // Merge the URL hash state with the current app state
    state.accounts = union(state.accounts, hashState.accounts || [], (account) => account.id);
    state.hiddenRepos = new Set(union(state.hiddenRepos, hashState.hiddenRepos || []));
    typeof hashState.showForks === "boolean" && (state.showForks = hashState.showForks);
    typeof hashState.showArchived === "boolean" && (state.showArchived = hashState.showArchived);
    typeof hashState.delay === "number" && (state.delay = hashState.delay);

    this.setState(state);

    // Fetch account info for any new accounts that were added via the URL hash
    for (let account of state.accounts) {
      if (!account.loading && !account.loaded) {
        // This is a newly-added account, so fetch it's info from GitHub
        // tslint:disable-next-line:no-floating-promises
        fetchGitHubAccount(account, (updated) => this.updateAccount(updated));
      }
    }
  }

  /**
   * Determines whether the specified account already exists
   */
  public hasAccount(login: string | GitHubAccount): boolean {
    if (typeof login === "object") {
      login = login.login;
    }

    return Boolean(this.getAccount(login));
  }

  /**
   * Returns the account with the specified login
   */
  public getAccount(login: string) {
    return this.state.accounts.find(byLogin(login));
  }

  /**
   * Adds a new GitHub account with the specified login to the accounts list,
   * and asynchronously fetches the account info from GitHub
   */
  public async addAccount(login: string) {
    login = login.trim();

    if (this.hasAccount(login)) {
      // The account already exists
      return;
    }

    let account = new GitHubAccount({
      login,
      name: login,
      loading: true,
    });

    // Add this account
    let accounts = this.state.accounts.slice();
    accounts.push(account);
    this.setState({ accounts });

    // Fetch the account info from GitHub
    await fetchGitHubAccount(account, (updated) => this.updateAccount(updated));
  }

  /**
   * Removes the specified GitHub account from the accounts list
   */
  public updateAccount(account: GitHubAccount) {
    let accounts = this.state.accounts.slice();
    let index = accounts.findIndex(byLogin(account.login));

    if (index >= 0) {
      accounts.splice(index, 1, account);
      this.setState({ accounts });
    }
  }

  /**
   * Removes the specified GitHub account from the accounts list
   */
  public removeAccount(account: GitHubAccount) {
    let accounts = this.state.accounts.slice();
    let index = accounts.findIndex(byLogin(account.login));

    if (index >= 0) {
      accounts.splice(index, 1);
      this.setState({ accounts });
    }
  }

  /**
   * Adds or removes the specified GitHub repo from the `hiddenRepos` list
   */
  public toggleHidden(repo: GitHubRepo, hidden: boolean) {
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
   * Determines whether the GitHub Repo is current hidden
   */
  public isHidden(repo: GitHubRepo): boolean {
    if (this.state.hiddenRepos.has(repo.full_name)) {
      // This repo has been explicitly hidden
      return true;
    }

    if (repo.fork && !this.state.showForks) {
      // Don't show forked repos
      return true;
    }

    if (repo.archived && !this.state.showArchived) {
      // Don't show archived repos
      return true;
    }

    return false;
  }
}


/**
 * Used to find GitHub accounts by their "login" property
 */
function byLogin(login: string) {
  login = login.trim().toLowerCase();
  return (obj: { login: string }) => obj.login.trim().toLowerCase() === login;
}
