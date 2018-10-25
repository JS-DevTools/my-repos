import { GitHubAccount, GitHubAccountMap } from "./state";

interface Props {
  accounts: GitHubAccountMap;
  removeAccount(accountName: string): void;
  toggleRepo(accountName: string, repoName: string, include: boolean): void;
}

interface State {
  selectedAccount: string;
}

export class AccountList extends React.Component<Props, State> {
  public readonly state: State = {
    selectedAccount: "",
  };

  public render() {
    // Determine the selected account, or fallback to the first account in the list
    let selectedAccountKey = this.state.selectedAccount || [...this.props.accounts.keys()][0];
    let selectedAccount = this.props.accounts.get(selectedAccountKey);

    return (
      <div id="edit_account_list">
        <AccountNameList accounts={this.props.accounts} selected={selectedAccount} />
        <RepoList account={selectedAccount} />
      </div>
    );
  }
}


function AccountNameList({ accounts, selected }: { accounts: GitHubAccountMap, selected: GitHubAccount | undefined }) {
  return (
    <ul className="account-name-list">
      {[...accounts.entries()].map(([key, account]) => (
        <li className="account-name" key={key}>
          {account.name}
        </li>
      ))}
    </ul>
  );
}


function RepoList({ account }: { account: GitHubAccount | undefined }) {
  return (
    <ul className="repo-list">
      {account && [...account.repos.entries()].map(([key, repo]) => (
        <li className="repo" key={key}>
          {repo.name}
        </li>
      ))}
    </ul>
  );
}
