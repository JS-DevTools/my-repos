import { hash } from "../../hash";
import { accountCountCssClass } from "../../util";
import { AddAccount } from "../add-account/add-account";
import { FirstTimeProps } from "./props";

export function FirstTime(props: FirstTimeProps) {
  return (
    <aside id="first_time" className={accountCountCssClass(hash.accounts)}>
      <div className="responsive-container">
        <div className="welcome-message">
          <h3>Hi! 👋 Enter your GitHub username to get started</h3>
          <AddAccount submitButtonText="Show My Repos" {...props} />
        </div>
      </div>
    </aside>
  );
}
