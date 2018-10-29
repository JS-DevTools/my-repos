import { MouseEvent } from "react";
import { GitHubAccount, GitHubRepo } from "../../github";
import { Props } from "./props";

export function AccountList(props: Props) {
  let { accounts } = props;
  let count = accounts.length === 0 ? "empty" : accounts.length === 1 ? "one" : "multiple";

  return (
    <div id="edit_account_list" className={count}>
      <ul className="account-list">
        {accounts.map((account) => <AccountItem account={account} {...props} />)}
      </ul>
      {accounts.map((account) => <RepoList account={account} {...props} />)}
    </div>
  );
}

interface AccountItemProps extends Props {
  account: GitHubAccount;
}

class AccountItem extends React.Component<AccountItemProps, object> {
  public render() {
    let { account, selectedAccount } = this.props;

    return (
      <li key={account.id} className={account === selectedAccount ? "account selected" : "account"}>
        <a data-key={account.id} onClick={this.handleAccountClick}>
          {account.name}
        </a>
      </li>
    );
  }

  private handleAccountClick = (event: MouseEvent) => {
    let key = (event.target as HTMLElement).dataset.key!;
    this.props.selectAccount(parseFloat(key));
  }
}

interface RepoListProps extends Props {
  account: GitHubAccount;
}

function RepoList(props: RepoListProps) {
  let { account, selectedAccount } = props;

  return (
    <section className={account === selectedAccount ? "repo-list selected" : "repo-list"}>
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
