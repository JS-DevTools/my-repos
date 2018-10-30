import { params } from "../../params";
import { AccountsAndRepos } from "./account-list";
import { AddAccountForm } from "./add-account-form";
import { Props } from "./props";

export function EditDashboardDialog(props: Props) {
  return [
    <dialog key="dialog" open className={props.accounts.length === 0 ? "open empty" : "open"}>
      <header className="dialog-header">
        <img className="logo" src="img/logo.png" alt="logo image" />
        <h1>GitHub Repo Health</h1>
        <h2>See the health of all your GitHub repos on one page</h2>
      </header>
      <div className="dialog-body">
        <h3>{getTitle()}</h3>
        <AddAccountForm addAccount={props.addAccount} />
        <AccountsAndRepos {...props} />
      </div>

      <footer className="dialog-footer">
        <button type="button" disabled className="btn">Cancel</button>
        <button type="button" disabled className="btn btn-primary">Create My Dashboard</button>
      </footer>
    </dialog>,

    <div key="backdrop" className="backdrop"></div>
  ];
}

function getTitle(): string {
  if (params.isNew) {
    return "Hi! 👋 Enter your GitHub username below to get started";
  }
  else {
    return "Edit Your Dashboard";
  }
}
