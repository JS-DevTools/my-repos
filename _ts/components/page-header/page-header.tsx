import { config } from "../../config";
import { accountCountCssClass } from "../../util";
import { AddAccount } from "../add-account/add-account";
import { PageHeaderProps } from "./props";

export function PageHeader(props: PageHeaderProps) {
  return (
    <header id="page_header" className={accountCountCssClass(config.accounts)}>
      <div className="responsive-container">
        <img className="logo" src="img/logo.png" alt="logo image" />
        <h1>My GitHub Repos</h1>
        <h2>All your GitHub repos on one page</h2>

        <AddAccount {...props} />
      </div>
    </header>
  );
}
