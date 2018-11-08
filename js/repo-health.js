(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
const LOCAL_DEV_MODE = location.hostname === "localhost";
/**
 * A wrapper around the Fetch API, with added error handling and automatic response parsing.
 */
class ApiClient {
    /**
     * Returns the parsed response, or throws an error if an error response is returned
     */
    async fetch(input, init) {
        let [response] = await Promise.all([
            await fetchWithFallback(input, init),
            artificialDelay(),
        ]);
        // Parse the response, even if it's an error, since the body may contain error details
        let parsedResponseBody = await parseResponseBody(response);
        if (!response.ok) {
            throw this.createError(`${getUrl(input)} returned an HTTP ${response.status} (${response.statusText || "Error"}) response`, parsedResponseBody);
        }
        cacheResponse(input, response);
        return parsedResponseBody;
    }
    /**
     * Returns the parsed response if it's a valid JSON array; otherwise, or throws an error.
     */
    async fetchArray(input, init) {
        let parsedResponseBody = await this.fetch(input, init);
        if (!Array.isArray(parsedResponseBody)) {
            throw this.createError(`${getUrl(input)} did not return a JSON array as expected`, parsedResponseBody);
        }
        return parsedResponseBody;
    }
    /**
     * Returns the parsed response if it's a valid JSON object; otherwise, or throws an error.
     */
    async fetchObject(input, init) {
        let parsedResponseBody = await this.fetch(input, init);
        if (typeof parsedResponseBody !== "object") {
            throw this.createError(`${getUrl(input)} did not return a JSON object as expected`, parsedResponseBody);
        }
        else if (Array.isArray(parsedResponseBody)) {
            throw this.createError(`${getUrl(input)} returned a JSON array, but a JSON object was expected`, parsedResponseBody);
        }
        return parsedResponseBody;
    }
    /**
     * Creates an Error with the specified message, including the parsed response body
     */
    createError(message, parsedResponseBody) {
        return new Error(message + "\n" + JSON.stringify(parsedResponseBody, undefined, 2));
    }
}
exports.ApiClient = ApiClient;
/**
 * Fetches the requested HTTP resource, but falls-back to a previously-cached copy
 * from LocalStorage, if necessary.
 */
async function fetchWithFallback(input, init) {
    let primary, secondary;
    if (LOCAL_DEV_MODE) {
        // For local development, default to LocalStorage to avoid hitting API rate limits
        primary = fetchFromCache;
        secondary = fetch;
    }
    else {
        // In production, hit the API first, but fallback to LocalStorage if necessary
        primary = fetch;
        secondary = fetchFromCache;
    }
    let response = await primary(input, init);
    if (response.ok) {
        return response;
    }
    else {
        return secondary(input, init);
    }
}
/**
 * Fetches the requested resource from LocalStorage cache
 */
async function fetchFromCache(input) {
    // Default response (for a cache miss)
    let responsePOJO = {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
            "Content-Type": "text/plain",
            "Content-Length": "0",
        },
        body: "",
    };
    // See if we have a cached response for this resource
    let cache = localStorage.getItem(getUrl(input));
    if (cache) {
        try {
            responsePOJO = JSON.parse(cache);
        }
        catch (error) {
            responsePOJO.body = error.message;
        }
    }
    // Convert the response POJO into a real Fetch Response
    return new Response(responsePOJO.body, responsePOJO);
}
/**
 * Caches the given response for the specified HTTP resource
 */
async function cacheResponse(input, response) {
    // Convert the response to a POJO that can be cached
    let responsePOJO = {
        status: response.status,
        statusText: response.statusText,
        headers: util_1.mapToPOJO(response.headers),
        body: await response.clone().text(),
    };
    // Cache the response POJO as JSON in LocalStorage
    localStorage.setItem(getUrl(input), JSON.stringify(responsePOJO, undefined, 2));
}
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
        responseBody = await response.clone().text();
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
/**
 * Introduces an artificial delay during local development.
 */
function artificialDelay() {
    let milliseconds = 0;
    if (LOCAL_DEV_MODE) {
        milliseconds = 800;
    }
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
},{"./util":12}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function AccountItem(props) {
    let { account } = props;
    return (React.createElement("section", { key: account.id, className: "account" },
        React.createElement("header", null,
            React.createElement("h1", null,
                account.avatar_url && React.createElement("img", { src: account.avatar_url, className: "avatar" }),
                account.name))));
}
exports.AccountItem = AccountItem;
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const add_account_1 = require("../add-account/add-account");
const account_item_1 = require("./account-item");
function AccountList(props) {
    let { accounts } = props;
    let count = accounts.length === 0 ? "no-accounts" : accounts.length === 1 ? "has-one-account" : "has-accounts";
    return (React.createElement("main", { id: "account_list", className: count },
        React.createElement("div", { className: "responsive-container" },
            React.createElement(add_account_1.AddAccount, Object.assign({ submitButtonText: "Add" }, props)),
            accounts.map((account) => React.createElement(account_item_1.AccountItem, Object.assign({ account: account }, props))))));
}
exports.AccountList = AccountList;
},{"../add-account/add-account":4,"./account-item":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AddAccount extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            accountName: "",
            busy: false,
        };
        this.handleChange = (event) => {
            this.setState({ accountName: event.target.value });
        };
        this.handleSubmit = async (event) => {
            event.preventDefault();
            if (this.state.accountName) {
                this.setState({ busy: true });
                await this.props.addAccount(this.state.accountName.trim());
                this.setState({ accountName: "", busy: false });
            }
        };
    }
    render() {
        let { submitButtonText } = this.props;
        let { accountName, busy } = this.state;
        return (React.createElement("form", { className: `add-account form ${busy ? "busy" : ""}`, onSubmit: this.handleSubmit },
            React.createElement("dl", { className: "form-group" },
                React.createElement("dt", { className: "input-label" },
                    React.createElement("label", { htmlFor: "repo_owner" }, "GitHub Username")),
                React.createElement("dd", { className: "input-field" },
                    React.createElement("input", { type: "text", name: "account_name", className: "form-control short", maxLength: 100, autoFocus: true, autoCapitalize: "off", autoComplete: "on", spellCheck: false, placeholder: "GitHub Username", disabled: busy, value: accountName, onChange: this.handleChange }))),
            React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: busy }, submitButtonText)));
    }
}
exports.AddAccount = AddAccount;
},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const account_list_1 = require("../account-list/account-list");
const first_time_1 = require("../first-time/first-time");
const state_store_1 = require("./state-store");
class App extends React.Component {
    constructor(props) {
        super(props);
        state_store_1.StateStore.mixin(this);
    }
    render() {
        let { accounts } = this.state;
        return [
            React.createElement(first_time_1.FirstTime, { key: "first_time", addAccount: this.addAccount }),
            React.createElement(account_list_1.AccountList, Object.assign({ key: "account_list", addAccount: this.addAccount, removeAccount: this.removeAccount, toggleRepo: this.toggleRepo }, this.state)),
        ];
    }
}
exports.App = App;
},{"../account-list/account-list":3,"../first-time/first-time":8,"./state-store":7}],6:[function(require,module,exports){
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
    ]);
    // @ts-ignore - This line totally confuses the TypeScript compiler
    let [{ result: account, error: accountError }, { result: repos, error: repoError }] = safeResults;
    if (accountError) {
        // An error occurred while fetching the account, so create a dummy account
        // with the error message
        account = {
            ...accountPOJO,
            loading: false,
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
},{"../../github":9}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../../hash");
const fetch_github_account_1 = require("./fetch-github-account");
class StateStore {
    constructor() {
        this.state = {
            accounts: [],
        };
    }
    static mixin(obj) {
        let store = new StateStore();
        obj.state = store.state;
        obj.addAccount = store.addAccount.bind(obj);
        obj.replaceAccount = store.replaceAccount.bind(obj);
        obj.removeAccount = store.removeAccount.bind(obj);
        obj.toggleRepo = store.toggleRepo.bind(obj);
        // Immediately load all the accounts in the URL hash
        for (let accountName of hash_1.hash.accounts) {
            obj.addAccount(accountName);
        }
    }
    /**
     * Adds a new GitHub account with the specified name to the accounts list,
     * and asynchronously fetches the account info from GitHub
     */
    async addAccount(name) {
        // Does this account already exist
        let account = this.state.accounts.find(byName(name));
        if (account) {
            // The account already exists
            return;
        }
        // Create a temporary account object to populate the UI
        // while we fetch the account info from GitHub
        account = {
            id: Math.random(),
            name,
            login: name,
            avatar_url: "",
            bio: "",
            loading: true,
            repos: [],
        };
        // Add this account to the BEGINNING of the array.
        // This makes sure it's visible on small mobile screens.
        let accounts = this.state.accounts.slice();
        accounts.unshift(account);
        this.setState({ accounts });
        // Fetch the account info from GitHub and replace this temporary account
        // object with the real info
        await fetch_github_account_1.fetchGitHubAccount(account, this.replaceAccount);
        hash_1.hash.addAccount(name);
    }
    /**
     * Replaces the specified account in the accounts list with the given GitHub account object.
     */
    replaceAccount(oldAccountID, newAccount) {
        let accounts = this.state.accounts.slice();
        // Just to ensure we don't accidentally add duplicate accounts,
        // remove the new account if it already exists
        removeAccountByID(accounts, newAccount.id);
        // Remove the old account, and get its index,
        // so we can insert the new account at the same location
        let { index } = removeAccountByID(accounts, oldAccountID);
        // If the old account didn't exist, then just add new account at index zero
        if (index === -1) {
            index = 0;
        }
        // Add the new account at the same index as the removed account
        accounts.splice(index, 0, newAccount);
        this.setState({ accounts });
    }
    /**
     * Removes the specified GitHub account from the accounts list
     */
    removeAccount(id) {
        let accounts = this.state.accounts.slice();
        let { removed } = removeAccountByID(accounts, id);
        if (removed) {
            this.setState({ accounts });
            hash_1.hash.removeAccount(removed.name);
        }
    }
    /**
     * Toggles the "hidden" property of the specified GitHub repo
     */
    toggleRepo(accountID, repoID, hidden) {
        let accounts = this.state.accounts.slice();
        let account = accounts.find(byID(accountID));
        let repo = account.repos.find(byID(repoID));
        repo.hidden = hidden;
        this.setState({ accounts });
        hash_1.hash.toggleRepo(repo.full_name, hidden);
    }
}
exports.StateStore = StateStore;
/**
 * Removes the account with the specified ID from the array.
 */
function removeAccountByID(accounts, id) {
    let index = accounts.findIndex(byID(id));
    let removed;
    if (index >= 0) {
        removed = accounts.splice(index, 1)[0];
    }
    return { index, removed };
}
/**
 * Used to search an array for object with the specified "id" property
 */
function byID(id) {
    return (obj) => obj.id === id;
}
/**
 * Used to search an array for object with the specified "name" property
 */
function byName(name) {
    name = name.trim().toLowerCase();
    return (obj) => obj.name.trim().toLowerCase() === name;
}
},{"../../hash":10,"./fetch-github-account":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../../hash");
const add_account_1 = require("../add-account/add-account");
function FirstTime(props) {
    let count = hash_1.hash.accounts.size === 0 ? "no-accounts" : "has-accounts";
    return (React.createElement("section", { id: "first_time", className: count },
        React.createElement("header", { key: "header" },
            React.createElement("div", { className: "responsive-container" },
                React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
                React.createElement("h1", null, "GitHub Repo Health"),
                React.createElement("h2", null, "See the health of all your GitHub repos on one page"))),
        React.createElement("div", { className: "responsive-container" },
            React.createElement("div", { className: "welcome-message" },
                React.createElement("h3", null, "Hi! \uD83D\uDC4B Enter your GitHub username to get started"),
                React.createElement(add_account_1.AddAccount, Object.assign({ submitButtonText: "Show My Repos" }, props))))));
}
exports.FirstTime = FirstTime;
},{"../../hash":10,"../add-account/add-account":4}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("./api-client");
class GitHub {
    constructor() {
        this._client = new api_client_1.ApiClient();
    }
    /**
     * Fetches the specified GitHub account's info, NOT including its repos
     */
    async fetchAccount(name) {
        let accountPOJO = await this._client.fetchObject(`https://api.github.com/users/${name}`);
        if (isGitHubAccountPOJO(accountPOJO)) {
            return {
                ...accountPOJO,
                loading: false,
                repos: [],
            };
        }
        else {
            throw this._client.createError("Invalid GitHub account object:", accountPOJO);
        }
    }
    /**
     * Fetches the GitHub repos for the specified account
     */
    async fetchRepos(accountName) {
        let repoPOJOs = await this._client.fetchArray(`https://api.github.com/users/${accountName}/repos`);
        if (isArrayOfGitHubRepoPOJO(repoPOJOs)) {
            let repos = [];
            for (let repoPOJO of repoPOJOs) {
                repos.push({
                    ...repoPOJO,
                    hidden: false,
                });
            }
            return repos;
        }
        else {
            throw this._client.createError("Invalid GitHub repos:", repoPOJOs);
        }
    }
}
exports.GitHub = GitHub;
/**
 * Singleton instance of the GitHub API client
 */
exports.github = new GitHub();
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
},{"./api-client":1}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Reads and stores state in the URL hash
 */
class Hash {
    constructor() {
        let params = new URLSearchParams(location.hash.substr(1));
        this.accounts = parseStringSet(params.get("u"));
        this.hide = parseStringSet(params.get("hide"));
        this.options = {
            forks: parseBoolean(params.get("forks"))
        };
    }
    /**
     * Updates the URL hash to include the specified GitHub account
     */
    addAccount(name) {
        this.accounts.add(name);
        this._updateHash();
    }
    /**
     * Updates the URL hash to remove the specified GitHub account
     */
    removeAccount(name) {
        this.accounts.delete(name);
        this._updateHash();
    }
    /**
     * Updates the URL hash to hide or show the specified GitHub repo
     */
    toggleRepo(full_name, hidden) {
        if (hidden) {
            this.hide.add(full_name);
        }
        else {
            this.hide.delete(full_name);
        }
        this._updateHash();
    }
    /**
     * Updates the URL hash to with the specified options
     */
    setOptions(options) {
        Object.assign(this.options, options);
        this._updateHash();
    }
    /**
     * Updates the URL hash to match the properties of this object
     */
    _updateHash() {
        let params = new URLSearchParams();
        if (this.accounts.size > 0) {
            params.append("u", [...this.accounts].join(","));
        }
        if (this.hide.size > 0) {
            params.append("hide", [...this.hide].join(","));
        }
        if (this.options.forks) {
            params.append("forks", "yes");
        }
        let hashString = params.toString();
        location.hash = hashString;
    }
}
exports.Hash = Hash;
/**
 * The singleton instance of the Hash class.
 */
exports.hash = new Hash();
function parseStringSet(value) {
    if (!value) {
        return new Set();
    }
    else {
        return new Set(value.split(","));
    }
}
function parseBoolean(value) {
    if (!value) {
        return false;
    }
    else {
        return ["yes", "true", "on", "ok"].includes(value.toLowerCase());
    }
}
},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app/app");
ReactDOM.render(React.createElement(app_1.App, null), document.getElementById("react-app"));
},{"./components/app/app":5}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mapToPOJO(map) {
    let pojo = {};
    for (let [key, value] of map.entries()) {
        pojo[key.toString()] = value;
    }
    return pojo;
}
exports.mapToPOJO = mapToPOJO;
},{}]},{},[11])
//# sourceMappingURL=repo-health.js.map
