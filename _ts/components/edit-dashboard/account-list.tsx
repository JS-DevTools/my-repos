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
  let empty = accounts.length === 0;

  return (
    <div id="edit_account_list">
      <ul className={empty ? "account-list empty" : "account-list"}>
        {accounts.map((account) => <AccountItem account={account} {...props} />)}
      </ul>
      <ul className="repo-list">
        {
          selected && selected.repos.map((repo) =>
            <RepoItem account={selected!} repo={repo} {...props} />)
        }
      </ul>
    </div>
  );
}

interface AccountProps extends Props {
  account: GitHubAccount;
}

class AccountItem extends React.Component<AccountProps, object> {
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

interface RepoProps extends Props {
  account: GitHubAccount;
  repo: GitHubRepo;
}

class RepoItem extends React.Component<RepoProps, object> {
  public render() {
    let { repo } = this.props;

    return (
      <li key={repo.name} className="repo">
        {repo.name}
      </li>
    );
  }
}
