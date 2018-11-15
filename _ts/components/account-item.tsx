import { GitHubAccount } from "../github/github-account";
import { RepoList } from "./repo-list";

interface AccountItemProps {
  account: GitHubAccount;
}

export function AccountItem(props: AccountItemProps) {
  let { account } = props;

  return (
    <section key={account.login} className="account">
      <header>
        <h1>
          <a href={account.html_url}>
            {account.avatar_url && <img src={account.avatar_url} className="avatar" />}
            {account.name}
          </a>
        </h1>
      </header>
      <AccountItemContents {...props} />
    </section>
  );
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
