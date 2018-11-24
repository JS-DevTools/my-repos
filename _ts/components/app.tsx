import { h } from "../virtual-dom";
import { AccountList } from "./account-list";
import { FirstTime } from "./first-time";
import { Options } from "./options";
import { PageHeader } from "./page-header";

export function App() {
  return [
    <PageHeader key="page_header" />,
    <Options key="options" />,
    <AccountList key="account_list" />,
    <FirstTime key="first_time" />,
  ];
}
