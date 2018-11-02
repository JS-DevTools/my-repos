import { AddAccount } from "../add-account/add-account";
import { AccountItem } from "./account-item";
import { AccountListProps } from "./props";

export function AccountList(props: AccountListProps) {
  let { accounts } = props;
  let count = accounts.length === 0 ? "no-accounts" : accounts.length === 1 ? "has-one-account" : "has-accounts";

  return (
    <main id="account_list" className={count}>
      <div className="responsive-container">
        <AddAccount submitButtonText="Add" {...props} />
        {accounts.map((account) => <AccountItem account={account} {...props} />)}
      </div>
    </main>
  );
}
