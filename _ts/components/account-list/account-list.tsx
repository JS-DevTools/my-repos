import { hash } from "../../hash";
import { accountCountCssClass } from "../../util";
import { AccountItem } from "./account-item";
import { AccountListProps } from "./props";

export function AccountList(props: AccountListProps) {
  let { accounts } = props;

  return (
    <main id="account_list" className={accountCountCssClass(hash.accounts)}>
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
