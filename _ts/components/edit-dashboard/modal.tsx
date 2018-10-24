import { params } from "../../params";
import { AddAccountForm } from "./add-account-form";

interface State {
  accounts: Readonly<{
    [accountName: string]: {
      [repoName: string]: boolean;
    };
  }>;
}

export class EditDashboardModal extends React.Component<{}, State> {
  public readonly state: State = {
    accounts: {},
  };

  public render() {
    return (
      <div className="dialog-container">
        <dialog open className="open">
          <header className="dialog-header">
            <img className="logo" src="img/logo.png" alt="logo image" />
            <h1>GitHub Repo Health</h1>
            <h2>See the health of all your GitHub repos on one page</h2>
          </header>
          <div className="dialog-body">
            <h3>{getTitle()}</h3>
            <AddAccountForm addAccount={this.addAccount} />
            <AccountList accounts={this.state.accounts}
              removeAccount={this.removeAccount} updateRepo={this.updateRepo} />
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
    let accounts = { ...this.state.accounts };
    accounts[accountName] = accounts[accountName] || {};
    this.setState({ accounts });
  }

  private removeAccount = (accountName: string) => {
    let accounts = { ...this.state.accounts };
    delete accounts[accountName];
    this.setState({ accounts });
  }

  private updateRepo = (accountName: string, repoName: string, include: boolean) => {
    let accounts = { ...this.state.accounts };
    accounts[accountName][repoName] = include;
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
