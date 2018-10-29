import { GitHubAccount } from "../../github";
import { EditDashboardDialog } from "../edit-dashboard/dialog";
import { fetchGitHubAccount } from "./fetch-github-account";

export interface AppState {
  accounts: GitHubAccount[];
  selectedAccount?: GitHubAccount;
}

export class App extends React.Component<{}, AppState> {
  public readonly state: AppState = {
    accounts: [],
    selectedAccount: undefined,
  };

  public render() {
    return [
      // @ts-ignore - TypeScript doesn't support React componnents that return arrays
      <EditDashboardDialog key="dialog"
        getAccount={this.getAccount}
        addAccount={this.addAccount}
        removeAccount={this.removeAccount}
        selectAccount={this.selectAccount}
        toggleRepo={this.toggleRepo}
        {...this.state}
      />,
    ];
  }

  private getAccount = (id: number) => this.state.accounts.find(byID(id));

  private addAccount = (name: string) => {
    // Does this account already exist
    let account = this.state.accounts.find(byName(name));

    if (account) {
      // The account already exists, so just select it
      return this.selectAccount(account.id);
    }

    // Create a temporary account object to populate the UI
    // while we fetch the account info from GitHub
    account = {
      id: Math.random(),
      name,
      login: name,
      avatar_url: "",
      bio: "",
      repos: [],
    };

    // Add this account to the BEGINNING of the array.
    // This makes sure it's visible on small mobile screens.
    let accounts = this.state.accounts.slice();
    accounts.unshift(account);
    this.setState({ accounts, selectedAccount: account });

    // Fetch the account info from GitHub and replace this temporary account
    // object with the real info
    fetchGitHubAccount(account, this.replaceAccount);
  }

  private replaceAccount = (oldAccountID: number, newAccount: GitHubAccount) => {
    let accounts = this.state.accounts.slice();

    // Just to ensure we don't accidentally add duplicate accounts,
    // remove the new account if it already exists
    removeByID(accounts, newAccount.id);

    // Remove the old account, and get its index,
    // so we can insert the new account at the same location
    let index = removeByID(accounts, oldAccountID);

    // If the old account didn't exist, then just add new account at index zero
    if (index === -1) {
      index = 0;
    }

    // Add the new account at the same index as the removed account
    accounts.splice(index, 0, newAccount);
    this.setState({ accounts, selectedAccount: newAccount });
  }

  private removeAccount = (id: number) => {
    let accounts = this.state.accounts.slice();
    let index = removeByID(accounts, id);

    if (index >= 0) {
      this.setState({ accounts });
    }
  }

  private selectAccount = (id: number) => {
    let account = this.state.accounts.find(byID(id));
    if (account) {
      this.setState({ selectedAccount: account });
    }
  }

  private toggleRepo = (accountID: number, repoID: number, include: boolean) => {
    let accounts = this.state.accounts.slice();
    let account = accounts.find(byID(accountID))!;
    let repo = account.repos.find(byID(repoID))!;
    repo.include = include;
    this.setState({ accounts });
  }
}

function removeByID(array: Array<{ id: number }>, id: number): number {
  let index = array.findIndex(byID(id));

  if (index >= 0) {
    array.splice(index, 1);
  }

  return index;
}

function byID(id: number) {
  return (obj: { id: number }) => obj.id === id;
}

function byName(name: string) {
  name = name.trim().toLowerCase();
  return (obj: { name: string }) => obj.name.trim().toLowerCase() === name;
}
