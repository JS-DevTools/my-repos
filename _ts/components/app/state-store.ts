import { GitHubAccount } from "../../github";
import { hash } from "../../hash";
import { fetchGitHubAccount } from "./fetch-github-account";

export type AddAccount = (name: string) => Promise<void>;

export type ReplaceAccount = (oldAccountID: number, newAccount: GitHubAccount) => void;

export type RemoveAccount = (id: number) => void;

export type ToggleRepo = (accountID: number, repoID: number, include: boolean) => void;

export interface AppState {
  accounts: GitHubAccount[];
}

export class StateStore {
  public static mixin(obj: StateStore) {
    let store = new StateStore();
    obj.state = store.state;
    obj.addAccount = store.addAccount.bind(obj);
    obj.replaceAccount = store.replaceAccount.bind(obj);
    obj.removeAccount = store.removeAccount.bind(obj);
    obj.toggleRepo = store.toggleRepo.bind(obj);

    // Immediately load all the accounts in the URL hash
    for (let accountName of hash.accounts) {
      obj.addAccount(accountName);
    }
  }

  public state: AppState = {
    accounts: [],
  };

  // Just here to satisfy TypeScript
  public setState!: SetState<AppState>;

  /**
   * Adds a new GitHub account with the specified name to the accounts list,
   * and asynchronously fetches the account info from GitHub
   */
  public async addAccount(name: string) {
    // Does this account already exist
    let account = this.state.accounts.find(byName(name));

    if (account) {
      // The account already exists
      return;
    }

    // Create a temporary account object to populate the UI
    // while we fetch the account info from GitHub
    account = {
      id: Math.random(),
      name,
      login: name,
      avatar_url: "",
      bio: "",
      loading: true,
      repos: [],
    };

    // Add this account to the BEGINNING of the array.
    // This makes sure it's visible on small mobile screens.
    let accounts = this.state.accounts.slice();
    accounts.unshift(account);
    this.setState({ accounts });

    // Fetch the account info from GitHub and replace this temporary account
    // object with the real info
    await fetchGitHubAccount(account, this.replaceAccount);
    hash.addAccount(name);
  }

  /**
   * Replaces the specified account in the accounts list with the given GitHub account object.
   */
  public replaceAccount(oldAccountID: number, newAccount: GitHubAccount) {
    let accounts = this.state.accounts.slice();

    // Just to ensure we don't accidentally add duplicate accounts,
    // remove the new account if it already exists
    removeAccountByID(accounts, newAccount.id);

    // Remove the old account, and get its index,
    // so we can insert the new account at the same location
    let { index } = removeAccountByID(accounts, oldAccountID);

    // If the old account didn't exist, then just add new account at index zero
    if (index === -1) {
      index = 0;
    }

    // Add the new account at the same index as the removed account
    accounts.splice(index, 0, newAccount);
    this.setState({ accounts });
  }

  /**
   * Removes the specified GitHub account from the accounts list
   */
  public removeAccount(id: number) {
    let accounts = this.state.accounts.slice();
    let { removed } = removeAccountByID(accounts, id);

    if (removed) {
      this.setState({ accounts });
      hash.removeAccount(removed.name);
    }
  }

  /**
   * Toggles the "hidden" property of the specified GitHub repo
   */
  public toggleRepo(accountID: number, repoID: number, hidden: boolean) {
    let accounts = this.state.accounts.slice();
    let account = accounts.find(byID(accountID))!;
    let repo = account.repos.find(byID(repoID))!;
    repo.hidden = hidden;
    this.setState({ accounts });
    hash.toggleRepo(repo.full_name, hidden);
  }
}


/**
 * Removes the account with the specified ID from the array.
 */
function removeAccountByID(accounts: GitHubAccount[], id: number) {
  let index = accounts.findIndex(byID(id));
  let removed: GitHubAccount | undefined;

  if (index >= 0) {
    removed = accounts.splice(index, 1)[0];
  }

  return { index, removed };
}

/**
 * Used to search an array for object with the specified "id" property
 */
function byID(id: number) {
  return (obj: { id: number }) => obj.id === id;
}

/**
 * Used to search an array for object with the specified "name" property
 */
function byName(name: string) {
  name = name.trim().toLowerCase();
  return (obj: { name: string }) => obj.name.trim().toLowerCase() === name;
}
