import { GitHubAccount } from "../github/github-account";
import { h } from "../virtual-dom";
import { RepoList } from "./repo-list";

interface AccountItemProps {
  account: GitHubAccount;
}

export function AccountItem(props: AccountItemProps) {
  let { account } = props;

  return (
    <section key={account.login} class="account">
      <header>
        <h1>
          <a href={account.html_url}>
            {account.avatar_url && <img src={account.avatar_url} class="avatar" />}
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
      <div class="error">
        <div class="error-message">{account.error}</div>
      </div>
    );
  }
  else if (account.loading) {
    return (
      <div class="loading">
        <div class="loading-message">Loading...</div>
      </div>
    );
  }
  else {
    return (
      <div class="no-repos">
        <div class="empty-message">There are no repos to show</div>
      </div>
    );
  }
}
