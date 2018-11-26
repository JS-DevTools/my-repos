import { stateStore } from "../state-store";
import { accountCountCssClass } from "../util";
import { h } from "../virtual-dom";
import { AddAccount } from "./add-account";

export function FirstTime() {
  let { accounts } = stateStore.state;

  return (
    <aside id="first_time" class={accountCountCssClass(accounts)}>
      <div class="responsive-container">
        <div class="welcome-message">
          <h3>Hi! 👋 Enter your GitHub username to get started</h3>
          <AddAccount submitButtonText="Show My Repos" />
        </div>
      </div>
    </aside>
  );
}
