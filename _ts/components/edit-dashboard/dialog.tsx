import { params } from "../../params";
import { AccountList } from "./account-list";
import { AddAccountForm } from "./add-account-form";
import { GitHubAccountMap } from "./state";

interface State {
  accounts: GitHubAccountMap;
}

export class EditDashboardDialog extends React.Component<{}, State> {
  public readonly state: State = {
    accounts: new Map(),
  };

  public render() {
    return (
      <div className="dialog-container">
        <dialog open className={this.state.accounts.size === 0 ? "open empty" : "open"}>
          <header className="dialog-header">
            <img className="logo" src="img/logo.png" alt="logo image" />
            <h1>GitHub Repo Health</h1>
            <h2>See the health of all your GitHub repos on one page</h2>
          </header>
          <div className="dialog-body">
            <h3>{getTitle()}</h3>
            <AddAccountForm addAccount={this.addAccount} />
            <AccountList accounts={this.state.accounts}
              removeAccount={this.removeAccount} toggleRepo={this.toggleRepo} />
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

  private addAccount = (accountName: string) => {
    accountName = accountName.trim();
    let accounts = new Map(this.state.accounts.entries());
    let key = accountName.toLowerCase();

    if (!accounts.has(key)) {
      accounts.set(key, {
        name: accountName,
        repos: new Map(),
      });
    }

    this.setState({ accounts });
  }

  private removeAccount = (accountName: string) => {
    accountName = accountName.trim();
    let accounts = new Map(this.state.accounts.entries());
    let key = accountName.toLowerCase();

    accounts.delete(key);

    this.setState({ accounts });
  }

  private toggleRepo = (accountName: string, repoName: string, include: boolean) => {
    accountName = accountName.trim();
    repoName = repoName.trim();
    let accounts = new Map(this.state.accounts.entries());
    let accountKey = accountName.toLowerCase();
    let repoKey = repoName.toLowerCase();

    accounts.get(accountKey)!.repos.get(repoKey)!.include = include;

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
