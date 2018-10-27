import { params } from "../../params";
import { AccountList } from "./account-list";
import { AddAccountForm } from "./add-account-form";
import { GitHubAccount } from "./state";


const dummyAccounts = [
  {
    name: "JamesMessinger", repos: [
      { name: "some-repo", include: true },
      { name: "some-other-repo", include: true },
      { name: "yet-another-repo", include: true },
      { name: "my-repo", include: true },
    ]
  },
  {
    name: "APIDevTools", repos: [
      { name: "swagger-parser", include: true },
      { name: "json-schema-ref-parser", include: true },
      { name: "swagger-express-middleware", include: true },
      { name: "swagger-cli", include: true },
      { name: "swagger-parser-3", include: true },
      { name: "json-schema-ref-parser-3", include: true },
      { name: "swagger-express-middleware-3", include: true },
      { name: "swagger-cli-3", include: true },
      { name: "swagger-parser-2", include: true },
      { name: "json-schema-ref-parser-2", include: true },
      { name: "swagger-express-middleware-2", include: true },
      { name: "swagger-cli-2", include: true },
    ]
  },
  {
    name: "JS-DevTools", repos: [
      { name: "simplifyify", include: true },
      { name: "ono", include: true },
      { name: "version-bump-promt", include: true },
      { name: "karma-host-environment", include: true },
    ]
  },
];

interface State {
  accounts: GitHubAccount[];
  selectedAccount?: GitHubAccount;
}

export class EditDashboardDialog extends React.Component<{}, State> {
  public readonly state: State = {
    accounts: dummyAccounts,
    selectedAccount: dummyAccounts[0],
  };

  public render() {
    return (
      <div className="dialog-container">
        <dialog open className={this.state.accounts.length === 0 ? "open empty" : "open"}>
          <header className="dialog-header">
            <img className="logo" src="img/logo.png" alt="logo image" />
            <h1>GitHub Repo Health</h1>
            <h2>See the health of all your GitHub repos on one page</h2>
          </header>
          <div className="dialog-body">
            <h3>{getTitle()}</h3>
            <AddAccountForm addAccount={this.addAccount} />
            <AccountList accounts={this.state.accounts} selected={this.state.selectedAccount}
              selectAccount={this.selectAccount} removeAccount={this.removeAccount}
              toggleRepo={this.toggleRepo} />
          </div>

          <footer className="dialog-footer">
            <button type="button" disabled className="btn">Cancel</button>
            <button type="button" disabled className="btn btn-primary">Create My Dashboard</button>
          </footer>
        </dialog>

        <div className="backdrop"></div>
      </div>
    );
  }

  private addAccount = (name: string) => {
    let accounts = this.state.accounts.slice();
    let account = accounts.find(byName(name));

    if (account) {
      // This account already exists, so select it
      this.setState({ selectedAccount: account });
    }
    else {
      // Add this account to the BEGINNING of the array.
      // This makes sure it's visible on small mobile screens.
      account = { name, repos: [] };
      accounts.unshift(account);
      this.setState({ accounts });
    }

    this.setState({ accounts, selectedAccount: account });
  }

  private removeAccount = (name: string) => {
    let accounts = this.state.accounts.slice();
    let index = accounts.findIndex(byName(name));

    if (index >= 0) {
      accounts.splice(index, 1);
      this.setState({ accounts });
    }
  }

  private selectAccount = (name: string) => {
    let account = this.state.accounts.find(byName(name));
    if (!account) {
      account = this.state.accounts[0];
    }
    this.setState({ selectedAccount: account });
  }

  private toggleRepo = (accountName: string, repoName: string, include: boolean) => {
    let accounts = this.state.accounts.slice();
    let account = accounts.find(byName(accountName))!;
    let repo = account.repos.find(byName(repoName))!;
    repo.include = include;
    this.setState({ accounts });
  }
}

function getTitle(): string {
  if (params.isNew) {
    return "Hi! 👋 Enter your GitHub username below to get started";
  }
  else {
    return "Edit Your Dashboard";
  }
}

function byName(name: string) {
  name = name.trim().toLowerCase();
  return (obj: { name: string }) => obj.name.trim().toLowerCase() === name;
}
