import { stateStore } from "../state-store";
import { accountCountCssClass } from "../util";
import { h } from "../virtual-dom";
import { AccountItem } from "./account-item";

export function AccountList() {
  let { accounts } = stateStore.state;

  return (
    <main id="account_list" class={accountCountCssClass(accounts)}>
      <div class="responsive-container">
        {accounts.map((account) => <AccountItem account={account} />)}
      </div>
    </main>
  );
}
