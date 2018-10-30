import { MouseEvent } from "react";
import { GitHubAccount } from "../../github";
import { Props } from "./props";
import { RepoList } from "./repo-list";

export function AccountsAndRepos(props: Props) {
  let { accounts } = props;
  let count = accounts.length === 0 ? "empty" : accounts.length === 1 ? "one" : "multiple";

  return (
    <div id="accounts_and_repos" className={count}>
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
        <a className="account-name" data-key={account.id} onClick={this.handleAccountClick}>
          {account.avatar_url && <img src={account.avatar_url} className="avatar" />}
          {account.name}
        </a>
      </li>
    );
  }

  private handleAccountClick = (event: MouseEvent) => {
    let key = (event.currentTarget as HTMLElement).dataset.key!;
    this.props.selectAccount(parseFloat(key));
  }
}
