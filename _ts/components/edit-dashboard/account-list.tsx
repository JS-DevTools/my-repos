import { MouseEvent } from "react";
import { GitHubAccount, GitHubRepo } from "./state";

interface Props {
  accounts: GitHubAccount[];
  selected?: GitHubAccount;
  selectAccount(name: string): void;
  removeAccount(name: string): void;
  toggleRepo(accountName: string, repoName: string, include: boolean): void;
}

export function AccountList(props: Props) {
  let { accounts, selected } = props;

  return (
    <div id="edit_account_list" className={accounts.length === 0 ? "empty" : ""}>
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
    let { account, selected } = this.props;

    return (
      <li key={account.name} className={account === selected ? "account selected" : "account"}>
        <a data-key={account.name} onClick={this.handleAccountClick}>
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

interface RepoListProps extends Props {
  account: GitHubAccount;
}

function RepoList(props: RepoListProps) {
  let { account, selected } = props;

  return (
    <section className={account === selected ? "repo-list selected" : "repo-list"}>
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
      <li key={repo.name} className="repo">
        {repo.name}
      </li>
    );
  }
}
