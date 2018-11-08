import { hash } from "../../hash";
import { AddAccount } from "../add-account/add-account";
import { FirstTimeProps } from "./props";

export function FirstTime(props: FirstTimeProps) {
  let count = hash.accounts.size === 0 ? "no-accounts" : "has-accounts";

  return (
    <section id="first_time" className={count}>
      <header key="header">
        <div className="responsive-container">
          <img className="logo" src="img/logo.png" alt="logo image" />
          <h1>GitHub Repo Health</h1>
          <h2>See the health of all your GitHub repos on one page</h2>
        </div>
      </header>
      <div className="responsive-container">
        <div className="welcome-message">
          <h3>Hi! 👋 Enter your GitHub username to get started</h3>
          <AddAccount submitButtonText="Show My Repos" {...props} />
        </div>
      </div>
    </section>
  );
}
