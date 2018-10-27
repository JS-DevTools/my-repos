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
function AccountList(props) {
    let { accounts, selected } = props;
    return (React.createElement("div", { id: "edit_account_list", className: accounts.length === 0 ? "empty" : "" },
        React.createElement("ul", { className: "account-list" }, accounts.map((account) => React.createElement(AccountItem, Object.assign({ account: account }, props)))),
        accounts.map((account) => React.createElement(RepoList, Object.assign({ account: account }, props)))));
}
exports.AccountList = AccountList;
class AccountItem extends React.Component {
    constructor() {
        super(...arguments);
        this.handleAccountClick = (event) => {
            let key = event.target.dataset.key;
            this.props.selectAccount(key);
        };
    }
    render() {
        let { account, selected } = this.props;
        return (React.createElement("li", { key: account.name, className: account === selected ? "account selected" : "account" },
            React.createElement("a", { "data-key": account.name, onClick: this.handleAccountClick }, account.name)));
    }
}
function RepoList(props) {
    let { account, selected } = props;
    return (React.createElement("section", { className: account === selected ? "repo-list selected" : "repo-list" },
        React.createElement("header", null,
            React.createElement("h3", null, account.name)),
        React.createElement("ul", null, account.repos.map((repo) => React.createElement(RepoItem, Object.assign({ repo: repo }, props))))));
}
class RepoItem extends React.Component {
    render() {
        let { repo } = this.props;
        return (React.createElement("li", { key: repo.name, className: "repo" }, repo.name));
    }
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
                this.props.addAccount(this.state.accountName.trim());
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
const dummyAccounts = [
    {
        name: "JamesMessinger", repos: [
            { name: "some-repo", include: true },
            { name: "some-other-repo", include: true },
            { name: "yet-another-repo", include: true },
            { name: "my-repo", include: true },
        ]
    },
    {
        name: "APIDevTools", repos: [
            { name: "swagger-parser", include: true },
            { name: "json-schema-ref-parser", include: true },
            { name: "swagger-express-middleware", include: true },
            { name: "swagger-cli", include: true },
            { name: "swagger-parser-3", include: true },
            { name: "json-schema-ref-parser-3", include: true },
            { name: "swagger-express-middleware-3", include: true },
            { name: "swagger-cli-3", include: true },
            { name: "swagger-parser-2", include: true },
            { name: "json-schema-ref-parser-2", include: true },
            { name: "swagger-express-middleware-2", include: true },
            { name: "swagger-cli-2", include: true },
        ]
    },
    {
        name: "JS-DevTools", repos: [
            { name: "simplifyify", include: true },
            { name: "ono", include: true },
            { name: "version-bump-promt", include: true },
            { name: "karma-host-environment", include: true },
        ]
    },
];
class EditDashboardDialog extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            accounts: dummyAccounts,
            selectedAccount: dummyAccounts[0],
        };
        this.addAccount = (name) => {
            let accounts = this.state.accounts.slice();
            let account = accounts.find(byName(name));
            if (account) {
                // This account already exists, so select it
                this.setState({ selectedAccount: account });
            }
            else {
                // Add this account to the BEGINNING of the array.
                // This makes sure it's visible on small mobile screens.
                account = { name, repos: [] };
                accounts.unshift(account);
                this.setState({ accounts });
            }
            this.setState({ accounts, selectedAccount: account });
        };
        this.removeAccount = (name) => {
            let accounts = this.state.accounts.slice();
            let index = accounts.findIndex(byName(name));
            if (index >= 0) {
                accounts.splice(index, 1);
                this.setState({ accounts });
            }
        };
        this.selectAccount = (name) => {
            let account = this.state.accounts.find(byName(name));
            if (!account) {
                account = this.state.accounts[0];
            }
            this.setState({ selectedAccount: account });
        };
        this.toggleRepo = (accountName, repoName, include) => {
            let accounts = this.state.accounts.slice();
            let account = accounts.find(byName(accountName));
            let repo = account.repos.find(byName(repoName));
            repo.include = include;
            this.setState({ accounts });
        };
    }
    render() {
        return (React.createElement("div", { className: "dialog-container" },
            React.createElement("dialog", { open: true, className: this.state.accounts.length === 0 ? "open empty" : "open" },
                React.createElement("header", { className: "dialog-header" },
                    React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
                    React.createElement("h1", null, "GitHub Repo Health"),
                    React.createElement("h2", null, "See the health of all your GitHub repos on one page")),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("h3", null, getTitle()),
                    React.createElement(add_account_form_1.AddAccountForm, { addAccount: this.addAccount }),
                    React.createElement(account_list_1.AccountList, { accounts: this.state.accounts, selected: this.state.selectedAccount, selectAccount: this.selectAccount, removeAccount: this.removeAccount, toggleRepo: this.toggleRepo })),
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
function byName(name) {
    name = name.trim().toLowerCase();
    return (obj) => obj.name.trim().toLowerCase() === name;
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
