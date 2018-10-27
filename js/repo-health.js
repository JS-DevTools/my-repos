(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("../edit-dashboard/dialog");
const dummyAccounts = [
    {
        id: "jamesmessinger",
        name: "JamesMessinger",
        repos: [
            { id: "some-repo", name: "some-repo", include: true },
            { id: "some-other-repo", name: "some-other-repo", include: true },
            { id: "yet-another-repo", name: "yet-another-repo", include: true },
            { id: "my-repo", name: "my-repo", include: true },
        ]
    },
    {
        id: "apidevtools",
        name: "APIDevTools",
        repos: [
            { id: "swagger-parser", name: "swagger-parser", include: true },
            { id: "json-schema-ref-parser", name: "json-schema-ref-parser", include: true },
            { id: "swagger-express-middleware", name: "swagger-express-middleware", include: true },
            { id: "swagger-cli", name: "swagger-cli", include: true },
            { id: "swagger-parser-3", name: "swagger-parser-3", include: true },
            { id: "json-schema-ref-parser-3", name: "json-schema-ref-parser-3", include: true },
            { id: "swagger-express-middleware-3", name: "swagger-express-middleware-3", include: true },
            { id: "swagger-cli-3", name: "swagger-cli-3", include: true },
            { id: "swagger-parser-2", name: "swagger-parser-2", include: true },
            { id: "json-schema-ref-parser-2", name: "json-schema-ref-parser-2", include: true },
            { id: "swagger-express-middleware-2", name: "swagger-express-middleware-2", include: true },
            { id: "swagger-cli-2", name: "swagger-cli-2", include: true },
        ]
    },
    {
        id: "js-devtools",
        name: "JS-DevTools",
        repos: [
            { id: "simplifyify", name: "simplifyify", include: true },
            { id: "ono", name: "ono", include: true },
            { id: "version-bump-promt", name: "version-bump-promt", include: true },
            { id: "karma-host-environment", name: "karma-host-environment", include: true },
        ]
    },
];
class App extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            accounts: dummyAccounts,
        };
        this.getAccount = (id) => this.state.accounts.find(byID(id));
        this.addAccount = (name) => {
            let id = createId(name);
            let account = this.getAccount(id);
            let accounts = this.state.accounts.slice();
            if (!account) {
                // Add this account to the BEGINNING of the array.
                // This makes sure it's visible on small mobile screens.
                account = { id, name, repos: [] };
                accounts.unshift(account);
                this.setState({ accounts });
            }
            return id;
        };
        this.removeAccount = (id) => {
            let accounts = this.state.accounts.slice();
            let index = accounts.findIndex(byID(id));
            if (index >= 0) {
                accounts.splice(index, 1);
                this.setState({ accounts });
            }
        };
        this.toggleRepo = (accountID, repoID, include) => {
            let accounts = this.state.accounts.slice();
            let account = accounts.find(byID(accountID));
            let repo = account.repos.find(byID(repoID));
            repo.include = include;
            this.setState({ accounts });
        };
    }
    render() {
        return [
            React.createElement(dialog_1.EditDashboardDialog, { key: "dialog", accounts: this.state.accounts, getAccount: this.getAccount, addAccount: this.addAccount, removeAccount: this.removeAccount, toggleRepo: this.toggleRepo }),
        ];
    }
}
exports.App = App;
function createId(name) {
    return name.trim().toLowerCase();
}
function byID(id) {
    return (obj) => obj.id === id;
}
},{"../edit-dashboard/dialog":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function AccountList(props) {
    let { accounts } = props;
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
        let { account, selectedAccountID } = this.props;
        return (React.createElement("li", { key: account.id, className: account.id === selectedAccountID ? "account selected" : "account" },
            React.createElement("a", { "data-key": account.id, onClick: this.handleAccountClick }, account.name)));
    }
}
function RepoList(props) {
    let { account, selectedAccountID } = props;
    return (React.createElement("section", { className: account.id === selectedAccountID ? "repo-list selected" : "repo-list" },
        React.createElement("header", null,
            React.createElement("h3", null, account.name)),
        React.createElement("ul", null, account.repos.map((repo) => React.createElement(RepoItem, Object.assign({ repo: repo }, props))))));
}
class RepoItem extends React.Component {
    render() {
        let { repo } = this.props;
        return (React.createElement("li", { key: repo.id, className: "repo" }, repo.name));
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
class EditDashboardDialog extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            selectedAccountID: "apidevtools",
        };
        this.addAccount = (name) => {
            let id = this.props.addAccount(name);
            this.selectAccount(id);
        };
        this.selectAccount = (id) => {
            this.setState({ selectedAccountID: id });
        };
    }
    render() {
        return [
            React.createElement("dialog", { key: "dialog", open: true, className: this.props.accounts.length === 0 ? "open empty" : "open" },
                React.createElement("header", { className: "dialog-header" },
                    React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
                    React.createElement("h1", null, "GitHub Repo Health"),
                    React.createElement("h2", null, "See the health of all your GitHub repos on one page")),
                React.createElement("div", { className: "dialog-body" },
                    React.createElement("h3", null, getTitle()),
                    React.createElement(add_account_form_1.AddAccountForm, { addAccount: this.addAccount }),
                    React.createElement(account_list_1.AccountList, { accounts: this.props.accounts, selectedAccountID: this.state.selectedAccountID, selectAccount: this.selectAccount, removeAccount: this.props.removeAccount, toggleRepo: this.props.toggleRepo })),
                React.createElement("footer", { className: "dialog-footer" },
                    React.createElement("button", { type: "button", disabled: true, className: "btn" }, "Cancel"),
                    React.createElement("button", { type: "button", disabled: true, className: "btn btn-primary" }, "Create My Dashboard"))),
            React.createElement("div", { key: "backdrop", className: "backdrop" })
        ];
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
const app_1 = require("./components/app/app");
ReactDOM.render(React.createElement(app_1.App, null), document.getElementById("react-app"));
},{"./components/app/app":1}],6:[function(require,module,exports){
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
