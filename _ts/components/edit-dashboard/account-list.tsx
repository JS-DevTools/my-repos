import { MouseEvent } from "react";
import { GitHubAccount, GitHubRepo } from "../app/state";

interface AccountListProps {
  accounts: GitHubAccount[];
  selectedAccountID: string;
  selectAccount(id: string): void;
  removeAccount(id: string): void;
  toggleRepo(accountID: string, repoID: string, include: boolean): void;
}

export function AccountList(props: AccountListProps) {
  let { accounts } = props;

  return (
    <div id="edit_account_list" className={accounts.length === 0 ? "empty" : ""}>
      <ul className="account-list">
        {accounts.map((account) => <AccountItem account={account} {...props} />)}
      </ul>
      {accounts.map((account) => <RepoList account={account} {...props} />)}
    </div>
  );
}

interface AccountItemProps extends AccountListProps {
  account: GitHubAccount;
}

class AccountItem extends React.Component<AccountItemProps, object> {
  public render() {
    let { account, selectedAccountID } = this.props;

    return (
      <li key={account.id} className={account.id === selectedAccountID ? "account selected" : "account"}>
        <a data-key={account.id} onClick={this.handleAccountClick}>
          {account.name}
        </a>
      </li>
    );
  }

  private handleAccountClick = (event: MouseEvent) => {
    let key = (event.target as HTMLElement).dataset.key!;
    this.props.selectAccount(key);
  }
}

interface RepoListProps extends AccountListProps {
  account: GitHubAccount;
}

function RepoList(props: RepoListProps) {
  let { account, selectedAccountID } = props;

  return (
    <section className={account.id === selectedAccountID ? "repo-list selected" : "repo-list"}>
      <header>
        <h3>{account.name}</h3>
      </header>
      <ul>
        {account.repos.map((repo) => <RepoItem repo={repo} {...props} />)}
      </ul>
    </section>
  );
}

interface RepoItemProps extends RepoListProps {
  repo: GitHubRepo;
}

class RepoItem extends React.Component<RepoItemProps, object> {
  public render() {
    let { repo } = this.props;

    return (
      <li key={repo.id} className="repo">
        {repo.name}
      </li>
    );
  }
}
