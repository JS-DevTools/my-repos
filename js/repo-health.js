(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const params_1 = require("../params");
const dialog_1 = require("./edit-dashboard/dialog");
function App() {
    if (params_1.params.isNew) {
        return React.createElement(dialog_1.EditDashboardDialog, null);
    }
    else {
        return React.createElement("main", null, "Hello, world");
    }
}
exports.App = App;
},{"../params":6,"./edit-dashboard/dialog":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AccountList extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            selectedAccount: "",
        };
    }
    render() {
        // Determine the selected account, or fallback to the first account in the list
        let selectedAccountKey = this.state.selectedAccount || [...this.props.accounts.keys()][0];
        let selectedAccount = this.props.accounts.get(selectedAccountKey);
        return (React.createElement("div", { id: "edit_account_list" },
            React.createElement(AccountNameList, { accounts: this.props.accounts, selected: selectedAccount }),
            React.createElement(RepoList, { account: selectedAccount })));
    }
}
exports.AccountList = AccountList;
function AccountNameList({ accounts, selected }) {
    return (React.createElement("ul", { className: "account-name-list" }, [...accounts.entries()].map(([key, account]) => (React.createElement("li", { className: "account-name", key: key }, account.name)))));
}
function RepoList({ account }) {
    return (React.createElement("ul", { className: "repo-list" }, account && [...account.repos.entries()].map(([key, repo]) => (React.createElement("li", { className: "repo", key: key }, repo.name)))));
}
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AddAccountForm extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            accountName: "",
        };
        this.handleChange = (event) => {
            this.setState({ accountName: event.target.value });
        };
        this.handleSubmit = (event) => {
            event.preventDefault();
            if (this.state.accountName) {
                this.props.addAccount(this.state.accountName);
                this.setState({ accountName: "" });
            }
        };
    }
    render() {
        return (React.createElement("form", { id: "add_account_form", onSubmit: this.handleSubmit },
            React.createElement("div", { className: "clearfix" },
                React.createElement("dl", { className: "form-group" },
                    React.createElement("dt", { className: "input-label" },
                        React.createElement("label", { htmlFor: "repo_owner" }, "GitHub Username")),
                    React.createElement("dd", { className: "input-field" },
                        React.createElement("input", { type: "text", name: "account_name", className: "form-control short", maxLength: 100, autoFocus: true, autoCapitalize: "off", autoComplete: "off", spellCheck: false, value: this.state.accountName, onChange: this.handleChange }))),
                React.createElement("button", { type: "submit", className: "btn btn-primary" }, "Add"))));
    }
}
exports.AddAccountForm = AddAccountForm;
},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const params_1 = require("../../params");
const account_list_1 = require("./account-list");
const add_account_form_1 = require("./add-account-form");
class EditDashboardDialog extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            accounts: new Map(),
        };
        this.addAccount = (accountName) => {
            accountName = accountName.trim();
            let accounts = new Map(this.state.accounts.entries());
            let key = accountName.toLowerCase();
            if (!accounts.has(key)) {
                accounts.set(key, {
                    name: accountName,
                    repos: new Map(),
                });
            }
            this.setState({ accounts });
        };
        this.removeAccount = (accountName) => {
            accountName = accountName.trim();
            let accounts = new Map(this.state.accounts.entries());
            let key = accountName.toLowerCase();
            accounts.delete(key);
            this.setState({ accounts });
        };
        this.toggleRepo = (accountName, repoName, include) => {
            accountName = accountName.trim();
            repoName = repoName.trim();
            let accounts = new Map(this.state.accounts.entries());
            let accountKey = accountName.toLowerCase();
            let repoKey = repoName.toLowerCase();
            accounts.get(accountKey).repos.get(repoKey).include = include;
            this.setState({ accounts });
        };
    }
    render() {
        return (React.createElement("div", { className: "dialog-container" },
            React.createElement("dialog", { open: true, className: this.state.accounts.size === 0 ? "open empty" : "open" },
                React.createElement("header", { className: "dialog-header" },
                    React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
                    React.createElement("h1", null, "GitHub Repo Health"),
                    React.createElement("h2", null, "See the health of all your GitHub repos on one page")),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("h3", null, getTitle()),
                    React.createElement(add_account_form_1.AddAccountForm, { addAccount: this.addAccount }),
                    React.createElement(account_list_1.AccountList, { accounts: this.state.accounts, removeAccount: this.removeAccount, toggleRepo: this.toggleRepo })),
                React.createElement("footer", { className: "dialog-footer" },
                    React.createElement("button", { type: "button", disabled: true, className: "btn" }, "Cancel"),
                    React.createElement("button", { type: "button", disabled: true, className: "btn btn-primary" }, "Create My Dashboard"))),
            React.createElement("div", { className: "backdrop" })));
    }
}
exports.EditDashboardDialog = EditDashboardDialog;
function getTitle() {
    if (params_1.params.isNew) {
        return "Hi! 👋 Enter your GitHub username below to get started";
    }
    else {
        return "Edit Your Dashboard";
    }
}
},{"../../params":6,"./account-list":2,"./add-account-form":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app");
ReactDOM.render(React.createElement(app_1.App, null), document.getElementById("react-app"));
},{"./components/app":1}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Params {
    constructor() {
        this._query = new URLSearchParams(location.search);
        // If the params are empty when the page first loads, then we're building a new dashboard,
        // rather than showing or editing an existing one
        this.isNew = this.isEmpty;
    }
    get isEmpty() {
        return !this._query.has("include");
    }
    toString() {
        this._query.sort();
        return this._query.toString();
    }
}
/**
 * Singleton reference to the page's query params
 */
exports.params = new Params();
},{}]},{},[5])
//# sourceMappingURL=repo-health.js.map
