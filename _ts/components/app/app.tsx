import { EditDashboardDialog } from "../edit-dashboard/dialog";
import { AppState } from "./state";

const dummyAccounts = [
  {
    id: "jamesmessinger",
    name: "JamesMessinger",
    repos: [
      { id: "some-repo", name: "some-repo", include: true },
      { id: "some-other-repo", name: "some-other-repo", include: true },
      { id: "yet-another-repo", name: "yet-another-repo", include: true },
      { id: "my-repo", name: "my-repo", include: true },
    ]
  },
  {
    id: "apidevtools",
    name: "APIDevTools",
    repos: [
      { id: "swagger-parser", name: "swagger-parser", include: true },
      { id: "json-schema-ref-parser", name: "json-schema-ref-parser", include: true },
      { id: "swagger-express-middleware", name: "swagger-express-middleware", include: true },
      { id: "swagger-cli", name: "swagger-cli", include: true },
      { id: "swagger-parser-3", name: "swagger-parser-3", include: true },
      { id: "json-schema-ref-parser-3", name: "json-schema-ref-parser-3", include: true },
      { id: "swagger-express-middleware-3", name: "swagger-express-middleware-3", include: true },
      { id: "swagger-cli-3", name: "swagger-cli-3", include: true },
      { id: "swagger-parser-2", name: "swagger-parser-2", include: true },
      { id: "json-schema-ref-parser-2", name: "json-schema-ref-parser-2", include: true },
      { id: "swagger-express-middleware-2", name: "swagger-express-middleware-2", include: true },
      { id: "swagger-cli-2", name: "swagger-cli-2", include: true },
    ]
  },
  {
    id: "js-devtools",
    name: "JS-DevTools",
    repos: [
      { id: "simplifyify", name: "simplifyify", include: true },
      { id: "ono", name: "ono", include: true },
      { id: "version-bump-promt", name: "version-bump-promt", include: true },
      { id: "karma-host-environment", name: "karma-host-environment", include: true },
    ]
  },
];


export class App extends React.Component<{}, AppState> {
  public readonly state: AppState = {
    accounts: dummyAccounts,
  };

  public render() {
    return [
      <EditDashboardDialog key="dialog"
        accounts={this.state.accounts}
        getAccount={this.getAccount}
        addAccount={this.addAccount}
        removeAccount={this.removeAccount}
        toggleRepo={this.toggleRepo}
      />,
    ];
  }

  private getAccount = (id: string) => this.state.accounts.find(byID(id));

  private addAccount = (name: string) => {
    let id = createId(name);
    let account = this.getAccount(id);
    let accounts = this.state.accounts.slice();

    if (!account) {
      // Add this account to the BEGINNING of the array.
      // This makes sure it's visible on small mobile screens.
      account = { id, name, repos: [] };
      accounts.unshift(account);
      this.setState({ accounts });
    }

    return id;
  }

  private removeAccount = (id: string) => {
    let accounts = this.state.accounts.slice();
    let index = accounts.findIndex(byID(id));

    if (index >= 0) {
      accounts.splice(index, 1);
      this.setState({ accounts });
    }
  }

  private toggleRepo = (accountID: string, repoID: string, include: boolean) => {
    let accounts = this.state.accounts.slice();
    let account = accounts.find(byID(accountID))!;
    let repo = account.repos.find(byID(repoID))!;
    repo.include = include;
    this.setState({ accounts });
  }
}

function createId(name: string): string {
  return name.trim().toLowerCase();
}

function byID(id: string) {
  return (obj: { id: string }) => obj.id === id;
}
