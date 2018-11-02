import { GitHubAccount } from "../../github";
import { AccountListProps } from "./props";

interface AccountItemProps extends AccountListProps {
  account: GitHubAccount;
}

export function AccountItem(props: AccountItemProps) {
  let { account } = props;

  return (
    <section key={account.id} className="account">
      <header>
        <h1>
          {account.avatar_url && <img src={account.avatar_url} className="avatar" />}
          {account.name}
        </h1>
      </header>
    </section>
  );
}
