import { AddAccount } from "../add-account/add-account";
import { AccountItem } from "./account-item";
import { AccountListProps } from "./props";

export function AccountList(props: AccountListProps) {
  let { accounts } = props;
  let count = accounts.length === 0 ? "no-accounts" : accounts.length === 1 ? "has-one-account" : "has-accounts";

  return (
    <main id="account_list" className={count}>
      <div className="responsive-container">
        <div className="add-account-toggle">
          <input id="add_account_toggle" type="checkbox" className="toggle" />
          <label htmlFor="add_account_toggle" className="toggle-label"></label>

          <AddAccount submitButtonText="Add" {...props} />
        </div>
        {accounts.map((account) => <AccountItem account={account} {...props} />)}
      </div>
    </main>
  );
}
