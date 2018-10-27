import { params } from "../../params";
import { GitHubAccount } from "../app/state";
import { AccountList } from "./account-list";
import { AddAccountForm } from "./add-account-form";

interface Props {
  accounts: GitHubAccount[];
  getAccount(id: string): GitHubAccount | undefined;
  addAccount(name: string): string;
  removeAccount(id: string): void;
  toggleRepo(accountName: string, repoName: string, include: boolean): void;
}

interface State {
  selectedAccountID: string;
}

export class EditDashboardDialog extends React.Component<Props, State> {
  public readonly state: State = {
    selectedAccountID: "apidevtools",
  };

  public render() {
    return [
      <dialog key="dialog" open className={this.props.accounts.length === 0 ? "open empty" : "open"}>
        <header className="dialog-header">
          <img className="logo" src="img/logo.png" alt="logo image" />
          <h1>GitHub Repo Health</h1>
          <h2>See the health of all your GitHub repos on one page</h2>
        </header>
        <div className="dialog-body">
          <h3>{getTitle()}</h3>
          <AddAccountForm addAccount={this.addAccount} />
          <AccountList
            accounts={this.props.accounts}
            selectedAccountID={this.state.selectedAccountID}
            selectAccount={this.selectAccount}
            removeAccount={this.props.removeAccount}
            toggleRepo={this.props.toggleRepo}
          />
        </div>

        <footer className="dialog-footer">
          <button type="button" disabled className="btn">Cancel</button>
          <button type="button" disabled className="btn btn-primary">Create My Dashboard</button>
        </footer>
      </dialog>,

      <div key="backdrop" className="backdrop"></div>
    ];
  }

  private addAccount = (name: string) => {
    let id = this.props.addAccount(name);
    this.selectAccount(id);
  }

  private selectAccount = (id: string) => {
    this.setState({ selectedAccountID: id });
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
