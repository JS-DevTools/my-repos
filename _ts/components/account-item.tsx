// tslint:disable:no-duplicate-imports
import * as React from "react";
import { MouseEvent } from "react";
import { GitHubAccount } from "../github/github-account";
import { stateStore } from "../state-store";
import { Octicon } from "./octicon";
import { RepoList } from "./repo-list";

interface AccountItemProps {
  account: GitHubAccount;
}

export class AccountItem extends React.Component<AccountItemProps> {
  public render() {
    let { account } = this.props;

    return (
      <section key={account.login} className="account">
        <header>
          <h1>
            <a href={account.html_url}>
              {account.avatar_url && <img src={account.avatar_url} className="avatar" />}
              {account.name}
            </a>
            <a href={`#remove=${account.login}`} className="remove-account"
              title={`Remove ${account.login}`} onClick={this.handleRemoveClick}>
              <Octicon name="x" />
            </a>
          </h1>
        </header>
        <AccountItemContents {...this.props} />
      </section>
    );
  }

  private readonly handleRemoveClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    stateStore.removeAccount(this.props.account);
  }
}

function AccountItemContents(props: AccountItemProps) {
  let { account } = props;

  if (account.repos.length > 0) {
    return <RepoList account={account} />;
  }
  else if (account.error) {
    return (
      <div className="error">
        <div className="error-message">{account.error}</div>
      </div>
    );
  }
  else if (account.loading) {
    return (
      <div className="loading">
        <div className="loading-message">Loading...</div>
      </div>
    );
  }
  else {
    return (
      <div className="no-repos">
        <div className="empty-message">There are no repos to show</div>
      </div>
    );
  }
}
