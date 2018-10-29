(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A wrapper around the Fetch API, with added error handling and automatic response parsing.
 */
exports.apiClient = {
    /**
     * Returns the parsed response, or throws an error if an error response is returned
     */
    async fetch(input, init) {
        let response = await fetch(input, init);
        let parsedResponseBody = await parseResponseBody(response);
        if (!response.ok) {
            throw exports.apiClient.createError(`${getUrl(input)} returned an HTTP ${response.status} (${response.statusText || "Error"}) response`, parsedResponseBody);
        }
        return parsedResponseBody;
    },
    /**
     * Returns the parsed response if it's a valid JSON array; otherwise, or throws an error.
     */
    async fetchArray(input, init) {
        let parsedResponseBody = await exports.apiClient.fetch(input, init);
        if (!Array.isArray(parsedResponseBody)) {
            throw exports.apiClient.createError(`${getUrl(input)} did not return a JSON array as expected`, parsedResponseBody);
        }
        return parsedResponseBody;
    },
    /**
     * Returns the parsed response if it's a valid JSON object; otherwise, or throws an error.
     */
    async fetchObject(input, init) {
        let parsedResponseBody = await exports.apiClient.fetch(input, init);
        if (typeof parsedResponseBody !== "object") {
            throw exports.apiClient.createError(`${getUrl(input)} did not return a JSON object as expected`, parsedResponseBody);
        }
        else if (Array.isArray(parsedResponseBody)) {
            throw exports.apiClient.createError(`${getUrl(input)} returned a JSON array, but a JSON object was expected`, parsedResponseBody);
        }
        return parsedResponseBody;
    },
    /**
     * Creates an Error with the specified message, including the parsed response body
     */
    createError(message, parsedResponseBody) {
        return new Error(message + "\n" + JSON.stringify(parsedResponseBody, undefined, 2));
    },
};
/**
 * Returns the URL from the given RequestInfo value
 */
function getUrl(input) {
    return typeof input === "string" ? input : input.url;
}
/**
 * Tries to parse the response as JSON, but falls back to text if that fails
 */
async function parseResponseBody(response) {
    let responseBody;
    try {
        responseBody = await response.text();
    }
    catch (error) {
        // The response could not be read
        return undefined;
    }
    try {
        // Try to parse the response as JSON
        let parsedResponseBody = JSON.parse(responseBody);
        if (typeof parsedResponseBody === "object") {
            // Return the parsed object or array
            return parsedResponseBody;
        }
        else {
            // Coerce the result to a string
            return String(parsedResponseBody);
        }
    }
    catch (error) {
        // The response couldn't be parsed as JSON, so just return it as a string
        return responseBody;
    }
}
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("../edit-dashboard/dialog");
const fetch_github_account_1 = require("./fetch-github-account");
class App extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            accounts: [],
            selectedAccount: undefined,
        };
        this.getAccount = (id) => this.state.accounts.find(byID(id));
        this.addAccount = (name) => {
            // Does this account already exist
            let account = this.state.accounts.find(byName(name));
            if (account) {
                // The account already exists, so just select it
                return this.selectAccount(account.id);
            }
            // Create a temporary account object to populate the UI
            // while we fetch the account info from GitHub
            account = {
                id: Math.random(),
                name,
                login: name,
                avatar_url: "",
                bio: "",
                repos: [],
            };
            // Add this account to the BEGINNING of the array.
            // This makes sure it's visible on small mobile screens.
            let accounts = this.state.accounts.slice();
            accounts.unshift(account);
            this.setState({ accounts, selectedAccount: account });
            // Fetch the account info from GitHub and replace this temporary account
            // object with the real info
            fetch_github_account_1.fetchGitHubAccount(account, this.replaceAccount);
        };
        this.replaceAccount = (oldAccountID, newAccount) => {
            let accounts = this.state.accounts.slice();
            // Just to ensure we don't accidentally add duplicate accounts,
            // remove the new account if it already exists
            removeByID(accounts, newAccount.id);
            // Remove the old account, and get its index,
            // so we can insert the new account at the same location
            let index = removeByID(accounts, oldAccountID);
            // If the old account didn't exist, then just add new account at index zero
            if (index === -1) {
                index = 0;
            }
            // Add the new account at the same index as the removed account
            accounts.splice(index, 0, newAccount);
            this.setState({ accounts, selectedAccount: newAccount });
        };
        this.removeAccount = (id) => {
            let accounts = this.state.accounts.slice();
            let index = removeByID(accounts, id);
            if (index >= 0) {
                this.setState({ accounts });
            }
        };
        this.selectAccount = (id) => {
            let account = this.state.accounts.find(byID(id));
            if (account) {
                this.setState({ selectedAccount: account });
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
            // @ts-ignore - TypeScript doesn't support React componnents that return arrays
            React.createElement(dialog_1.EditDashboardDialog, Object.assign({ key: "dialog", getAccount: this.getAccount, addAccount: this.addAccount, removeAccount: this.removeAccount, selectAccount: this.selectAccount, toggleRepo: this.toggleRepo }, this.state)),
        ];
    }
}
exports.App = App;
function removeByID(array, id) {
    let index = array.findIndex(byID(id));
    if (index >= 0) {
        array.splice(index, 1);
    }
    return index;
}
function byID(id) {
    return (obj) => obj.id === id;
}
function byName(name) {
    name = name.trim().toLowerCase();
    return (obj) => obj.name.trim().toLowerCase() === name;
}
},{"../edit-dashboard/dialog":6,"./fetch-github-account":3}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("../../github");
/**
 * Fetches the specified GitHub account and its repos, and then calls the given callback function
 * to update the app state.
 */
async function fetchGitHubAccount(accountPOJO, replaceAccount) {
    // Fetch the GitHub account and repos at the same time
    let safeResults = await Promise.all([
        safeResolve(github_1.github.fetchAccount(accountPOJO.login)),
        safeResolve(github_1.github.fetchRepos(accountPOJO.login)),
        artificialDelay(10000),
    ]);
    // @ts-ignore - This line totally confuses the TypeScript compiler
    let [{ result: account, error: accountError }, { result: repos, error: repoError }] = safeResults;
    if (accountError) {
        // An error occurred while fetching the account, so create a dummy account
        // with the error message
        account = {
            ...accountPOJO,
            repos: [],
            error: accountError.message,
        };
    }
    else if (account && repoError) {
        // An error occurred while fetching the repos, so add the error message to the account
        account.error = repoError.message;
    }
    else if (account && repos) {
        // Everything succeeded, so add the repos to the account
        account.repos = repos;
    }
    replaceAccount(accountPOJO.id, account);
}
exports.fetchGitHubAccount = fetchGitHubAccount;
async function safeResolve(promise) {
    let result, error;
    try {
        result = await promise;
    }
    catch (err) {
        error = err;
    }
    return { result, error };
}
function artificialDelay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
},{"../../github":7}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function AccountList(props) {
    let { accounts } = props;
    let count = accounts.length === 0 ? "empty" : accounts.length === 1 ? "one" : "multiple";
    return (React.createElement("div", { id: "edit_account_list", className: count },
        React.createElement("ul", { className: "account-list" }, accounts.map((account) => React.createElement(AccountItem, Object.assign({ account: account }, props)))),
        accounts.map((account) => React.createElement(RepoList, Object.assign({ account: account }, props)))));
}
exports.AccountList = AccountList;
class AccountItem extends React.Component {
    constructor() {
        super(...arguments);
        this.handleAccountClick = (event) => {
            let key = event.target.dataset.key;
            this.props.selectAccount(parseFloat(key));
        };
    }
    render() {
        let { account, selectedAccount } = this.props;
        return (React.createElement("li", { key: account.id, className: account === selectedAccount ? "account selected" : "account" },
            React.createElement("a", { "data-key": account.id, onClick: this.handleAccountClick }, account.name)));
    }
}
function RepoList(props) {
    let { account, selectedAccount } = props;
    return (React.createElement("section", { className: account === selectedAccount ? "repo-list selected" : "repo-list" },
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
},{}],5:[function(require,module,exports){
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
                        React.createElement("input", { type: "text", name: "account_name", className: "form-control short", maxLength: 100, autoFocus: true, autoCapitalize: "off", autoComplete: "on", spellCheck: false, value: this.state.accountName, onChange: this.handleChange }))),
                React.createElement("button", { type: "submit", className: "btn btn-primary" }, "Add"))));
    }
}
exports.AddAccountForm = AddAccountForm;
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const params_1 = require("../../params");
const account_list_1 = require("./account-list");
const add_account_form_1 = require("./add-account-form");
function EditDashboardDialog(props) {
    return [
        React.createElement("dialog", { key: "dialog", open: true, className: props.accounts.length === 0 ? "open empty" : "open" },
            React.createElement("header", { className: "dialog-header" },
                React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
                React.createElement("h1", null, "GitHub Repo Health"),
                React.createElement("h2", null, "See the health of all your GitHub repos on one page")),
            React.createElement("div", { className: "dialog-body" },
                React.createElement("h3", null, getTitle()),
                React.createElement(add_account_form_1.AddAccountForm, { addAccount: props.addAccount }),
                React.createElement(account_list_1.AccountList, Object.assign({}, props))),
            React.createElement("footer", { className: "dialog-footer" },
                React.createElement("button", { type: "button", disabled: true, className: "btn" }, "Cancel"),
                React.createElement("button", { type: "button", disabled: true, className: "btn btn-primary" }, "Create My Dashboard"))),
        React.createElement("div", { key: "backdrop", className: "backdrop" })
    ];
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
},{"../../params":9,"./account-list":4,"./add-account-form":5}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("./api-client");
exports.github = {
    /**
     * Fetches the specified GitHub account's info, NOT including its repos
     */
    async fetchAccount(name) {
        let accountPOJO = await api_client_1.apiClient.fetchObject(`https://api.github.com/users/${name}`);
        if (isGitHubAccountPOJO(accountPOJO)) {
            return {
                ...accountPOJO,
                repos: [],
            };
        }
        else {
            throw api_client_1.apiClient.createError("Invalid GitHub account object:", accountPOJO);
        }
    },
    /**
     * Fetches the GitHub repos for the specified account
     */
    async fetchRepos(accountName) {
        let repoPOJOs = await api_client_1.apiClient.fetchArray(`https://api.github.com/users/${accountName}/repos`);
        if (isArrayOfGitHubRepoPOJO(repoPOJOs)) {
            let repos = [];
            for (let repoPOJO of repoPOJOs) {
                repos.push({ ...repoPOJO, include: true });
            }
            return repos;
        }
        else {
            throw api_client_1.apiClient.createError("Invalid GitHub repos:", repoPOJOs);
        }
    },
};
// tslint:disable-next-line:no-any
function isGitHubAccountPOJO(account) {
    return typeof account === "object" &&
        "login" in account && typeof account.login === "string" &&
        "name" in account && typeof account.name === "string" &&
        "bio" in account && typeof account.bio === "string" &&
        "avatar_url" in account && typeof account.avatar_url === "string";
}
// tslint:disable-next-line:no-any
function isArrayOfGitHubRepoPOJO(repos) {
    return repos.length > 0 &&
        typeof repos[0] === "object" &&
        typeof repos[0].name === "string";
}
},{"./api-client":1}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app/app");
ReactDOM.render(React.createElement(app_1.App, null), document.getElementById("react-app"));
},{"./components/app/app":2}],9:[function(require,module,exports){
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
},{}]},{},[8])
//# sourceMappingURL=repo-health.js.map
