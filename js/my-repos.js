/*!
 * My Repos v0.1.0 (November 10th 2018)
 * 
 * https://myrepos.io/
 * 
 * @author  James Messinger (https://jamesmessinger.com)
 * @license MIT
 */
/*!
 * My Repos v0.1.0 (November 10th 2018)
 * 
 * https://myrepos.io/
 * 
 * @author  James Messinger (https://jamesmessinger.com)
 * @license MIT
 */
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("./hash");
const util_1 = require("./util");
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
    if (util_1.LOCAL_DEV_MODE) {
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
    if (hash_1.hash.options.delay) {
        milliseconds = util_1.random(0, hash_1.hash.options.delay);
    }
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
},{"./hash":12,"./util":14}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repo_list_1 = require("../repo-list/repo-list");
function AccountItem(props) {
    let { account } = props;
    return (React.createElement("section", { key: account.id, className: "account" },
        React.createElement("header", null,
            React.createElement("h1", null,
                React.createElement("a", { href: `https://github.com/${account.login}` },
                    account.avatar_url && React.createElement("img", { src: account.avatar_url, className: "avatar" }),
                    account.name))),
        React.createElement(AccountItemContents, Object.assign({}, props))));
}
exports.AccountItem = AccountItem;
function AccountItemContents(props) {
    let { account, toggleRepo } = props;
    if (account.repos.length > 0) {
        return React.createElement(repo_list_1.RepoList, { account: account, toggleRepo: toggleRepo });
    }
    else if (account.error) {
        return (React.createElement("div", { className: "error" },
            React.createElement("div", { className: "error-message" }, account.error)));
    }
    else if (account.loading) {
        return (React.createElement("div", { className: "loading" },
            React.createElement("div", { className: "loading-message" }, "Loading...")));
    }
    else {
        return (React.createElement("div", { className: "no-repos" },
            React.createElement("div", { className: "empty-message" }, "There are no repos to show")));
    }
}
},{"../repo-list/repo-list":10}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../../hash");
const util_1 = require("../../util");
const account_item_1 = require("./account-item");
function AccountList(props) {
    let { accounts } = props;
    return (React.createElement("main", { id: "account_list", className: util_1.accountCountCssClass(hash_1.hash.accounts) },
        React.createElement("div", { className: "responsive-container" }, accounts.map((account) => React.createElement(account_item_1.AccountItem, Object.assign({ account: account }, props))))));
}
exports.AccountList = AccountList;
},{"../../hash":12,"../../util":14,"./account-item":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AddAccount extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            login: "",
            busy: false,
        };
        this.handleChange = (event) => {
            this.setState({ login: event.target.value });
        };
        this.handleSubmit = async (event) => {
            event.preventDefault();
            if (this.state.login) {
                this.setState({ busy: true });
                await this.props.addAccount(this.state.login.trim());
                this.setState({ login: "", busy: false });
            }
        };
    }
    render() {
        let { submitButtonText } = this.props;
        let { login, busy } = this.state;
        return (React.createElement("form", { className: `add-account form ${busy ? "busy" : ""}`, onSubmit: this.handleSubmit },
            React.createElement("dl", { className: "form-group" },
                React.createElement("dt", { className: "input-label" },
                    React.createElement("label", { htmlFor: "repo_owner" }, "GitHub Username")),
                React.createElement("dd", { className: "input-field" },
                    React.createElement("input", { type: "text", name: "account_name", className: "form-control short", maxLength: 100, autoFocus: true, autoCapitalize: "off", autoComplete: "on", spellCheck: false, placeholder: "GitHub Username", disabled: busy, value: login, onChange: this.handleChange }))),
            React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: busy }, submitButtonText || "Add")));
    }
}
exports.AddAccount = AddAccount;
},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const account_list_1 = require("../account-list/account-list");
const first_time_1 = require("../first-time/first-time");
const page_header_1 = require("../page-header/page-header");
const state_store_1 = require("./state-store");
class App extends React.Component {
    constructor(props) {
        super(props);
        state_store_1.StateStore.mixin(this);
    }
    render() {
        return [
            React.createElement(page_header_1.PageHeader, { key: "page_header", addAccount: this.addAccount }),
            React.createElement(account_list_1.AccountList, Object.assign({ key: "account_list", removeAccount: this.removeAccount, toggleRepo: this.toggleRepo }, this.state)),
            React.createElement(first_time_1.FirstTime, { key: "first_time", addAccount: this.addAccount }),
        ];
    }
}
exports.App = App;
},{"../account-list/account-list":3,"../first-time/first-time":8,"../page-header/page-header":9,"./state-store":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("../../github");
/**
 * Fetches the specified GitHub account and its repos, and then calls the given callback function
 * to update the app state.
 */
async function fetchGitHubAccount(account, replaceAccount) {
    // Fetch the GitHub account and repos at the same time
    let safeResults = await Promise.all([
        safeResolve(github_1.github.fetchAccount(account)),
        safeResolve(github_1.github.fetchRepos(account)),
    ]);
    // @ts-ignore - This line totally confuses the TypeScript compiler
    let [{ result: accountPOJO, error: accountError }, { result: repos, error: repoError }] = safeResults;
    let newAccount;
    if (accountError) {
        // An error occurred while fetching the account, so create a dummy account
        // with the error message
        newAccount = new github_1.GitHubAccount({
            ...account,
            error: accountError.message,
        });
    }
    else if (accountPOJO && repoError) {
        // An error occurred while fetching the repos, so add the error message to the account
        newAccount = new github_1.GitHubAccount({
            ...accountPOJO,
            error: repoError.message,
        });
    }
    else if (accountPOJO && repos) {
        // Everything succeeded, so add the repos to the account
        newAccount = new github_1.GitHubAccount({
            ...accountPOJO,
            repos,
        });
    }
    replaceAccount(account.id, newAccount);
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
},{"../../github":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("../../github");
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
        obj.syncWithHash = store.syncWithHash.bind(obj);
        obj.addAccount = store.addAccount.bind(obj);
        obj.replaceAccount = store.replaceAccount.bind(obj);
        obj.removeAccount = store.removeAccount.bind(obj);
        obj.toggleRepo = store.toggleRepo.bind(obj);
        // Immediately sync with the URL hash
        // HACK: Without setTimeout, the state doesn't update until AJAX fetches complete
        setTimeout(obj.syncWithHash, 0);
        // Re-sync with the hash anytime it changes
        hash_1.hash.addEventListener("hashchange", obj.syncWithHash);
    }
    /**
     * Syncs the app state with the URL hash
     */
    syncWithHash() {
        let accounts = [];
        for (let login of hash_1.hash.accounts) {
            // Create a temporary account object to populate the UI
            // while we fetch the account info from GitHub
            let account = new github_1.GitHubAccount({
                login,
                name: login,
                loading: true,
            });
            // Asynchronously fetch the account info from GitHub
            // and replace this temporary account object with the real info
            fetch_github_account_1.fetchGitHubAccount(account, this.replaceAccount);
            accounts.push(account);
        }
        this.setState({ accounts });
    }
    /**
     * Adds a new GitHub account with the specified login to the accounts list,
     * and asynchronously fetches the account info from GitHub
     */
    async addAccount(login) {
        // Does this account already exist
        let account = this.state.accounts.find(byLogin(login));
        if (account) {
            // The account already exists
            return;
        }
        // Create a temporary account object to populate the UI
        // while we fetch the account info from GitHub
        account = new github_1.GitHubAccount({
            login,
            name: login,
            loading: true,
        });
        // Add this account
        let accounts = this.state.accounts.slice();
        accounts.push(account);
        this.setState({ accounts });
        // Fetch the account info from GitHub
        // and replace this temporary account object with the real info
        await fetch_github_account_1.fetchGitHubAccount(account, this.replaceAccount);
    }
    /**
     * Replaces the specified account in the accounts list with the given GitHub account object.
     */
    replaceAccount(oldAccountID, newAccount) {
        let accounts = this.state.accounts.slice();
        // Remove the old account
        removeAccountByID(accounts, oldAccountID);
        // Just to ensure we don't accidentally add duplicate accounts,
        // remove the new account if it already exists
        removeAccountByID(accounts, newAccount.id);
        // Add the new account
        accounts.push(newAccount);
        // Sort the accounts so they're in the same order as the URL hash.
        // This makes it easy for users to hack the URL.
        let sortedAccounts = [];
        for (let login of hash_1.hash.accounts) {
            let index = accounts.findIndex(byLogin(login));
            if (index >= 0) {
                let [account] = accounts.splice(index, 1);
                sortedAccounts.push(account);
            }
        }
        // Append any additional accounts that aren't in the hash yet
        for (let account of accounts) {
            sortedAccounts.push(account);
            hash_1.hash.addAccount(account);
        }
        this.setState({ accounts: sortedAccounts });
    }
    /**
     * Removes the specified GitHub account from the accounts list
     */
    removeAccount(id) {
        let accounts = this.state.accounts.slice();
        let { removed } = removeAccountByID(accounts, id);
        if (removed) {
            this.setState({ accounts });
            hash_1.hash.removeAccount(removed);
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
        hash_1.hash.toggleRepo(account, repo, hidden);
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
 * Used to search an array for object with the specified "login" property
 */
function byLogin(login) {
    login = login.trim().toLowerCase();
    return (obj) => obj.login.trim().toLowerCase() === login;
}
},{"../../github":11,"../../hash":12,"./fetch-github-account":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../../hash");
const util_1 = require("../../util");
const add_account_1 = require("../add-account/add-account");
function FirstTime(props) {
    return (React.createElement("aside", { id: "first_time", className: util_1.accountCountCssClass(hash_1.hash.accounts) },
        React.createElement("div", { className: "responsive-container" },
            React.createElement("div", { className: "welcome-message" },
                React.createElement("h3", null, "Hi! \uD83D\uDC4B Enter your GitHub username to get started"),
                React.createElement(add_account_1.AddAccount, Object.assign({ submitButtonText: "Show My Repos" }, props))))));
}
exports.FirstTime = FirstTime;
},{"../../hash":12,"../../util":14,"../add-account/add-account":4}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../../hash");
const util_1 = require("../../util");
const add_account_1 = require("../add-account/add-account");
function PageHeader(props) {
    return (React.createElement("header", { id: "page_header", className: util_1.accountCountCssClass(hash_1.hash.accounts) },
        React.createElement("div", { className: "responsive-container" },
            React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
            React.createElement("h1", null, "My GitHub Repos"),
            React.createElement("h2", null, "All your GitHub repos on one page"),
            React.createElement(add_account_1.AddAccount, Object.assign({}, props)))));
}
exports.PageHeader = PageHeader;
},{"../../hash":12,"../../util":14,"../add-account/add-account":4}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../../hash");
function RepoList(props) {
    let { account, toggleRepo } = props;
    let repos = account.repos.filter(byOptions);
    return (React.createElement("ul", { className: "repo-list" }, repos.map((repo) => React.createElement(RepoItem, Object.assign({ repo: repo }, props)))));
}
exports.RepoList = RepoList;
function RepoItem(props) {
    let { account, repo } = props;
    return (React.createElement("li", { key: repo.id, className: "repo" },
        React.createElement("h2", null,
            React.createElement("a", { href: `https://github.com/${account.login}/${repo.name}` }, repo.name)),
        repo.description && React.createElement("h3", null, repo.description)));
}
/**
 * Returns true if the GitHub Repo should be shown, based on the current options
 */
function byOptions(repo) {
    if (repo.fork && !hash_1.hash.options.forks) {
        // Don't show forked repos
        return false;
    }
    else {
        return true;
    }
}
},{"../../hash":12}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("./api-client");
/**
 * Additional GitHub account properties that we need for this app
 */
class GitHubAccount {
    constructor(props = {}) {
        this.id = props.id || Math.random();
        this.login = props.login || "";
        this.name = props.name || "";
        this.avatar_url = props.avatar_url || "";
        this.bio = props.bio || "";
        this.repos = props.repos || [];
        this.loading = Boolean(props.loading);
        this.error = props.error;
    }
}
exports.GitHubAccount = GitHubAccount;
class GitHub {
    constructor() {
        this._client = new api_client_1.ApiClient();
    }
    /**
     * Fetches the specified GitHub account's info, NOT including its repos
     */
    async fetchAccount(account) {
        let accountPOJO = await this._client.fetchObject(`https://api.github.com/users/${account.login}`);
        if (isGitHubAccountPOJO(accountPOJO)) {
            return new GitHubAccount({
                ...accountPOJO,
                loading: false,
                repos: [],
            });
        }
        else {
            throw this._client.createError("Invalid GitHub account:", accountPOJO);
        }
    }
    /**
     * Fetches the GitHub repos for the specified account
     */
    async fetchRepos(account) {
        let repoPOJOs = await this._client.fetchArray(`https://api.github.com/users/${account.login}/repos`);
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
            throw this._client.createError("Invalid GitHub repo:", repoPOJOs);
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
},{"./api-client":1}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
// Artificially delay AJAX calls for local development, to simulate network latency
const defaultDelay = util_1.LOCAL_DEV_MODE ? 1000 : 0;
/**
 * Reads and stores state in the URL hash
 */
class Hash extends EventTarget {
    constructor() {
        super();
        this._accounts = new Set();
        this._hide = new Set();
        this._options = {
            forks: false,
            delay: defaultDelay,
        };
        /**
         * The accounts to show on the dashboard
         */
        this.accounts = this._accounts;
        /**
         * Specific repos to hide
         */
        this.hide = this._hide;
        /**
         * Options for how the dashboard should be displayed
         */
        this.options = this._options;
        this._handleHashChange();
        window.addEventListener("hashchange", () => this._handleHashChange());
    }
    /**
     * Updates the URL hash to include the specified GitHub account
     */
    addAccount(account) {
        this._accounts.add(account.login);
        this._updateHash();
    }
    /**
     * Updates the URL hash to remove the specified GitHub account
     */
    removeAccount(account) {
        this._accounts.delete(account.login);
        this._updateHash();
    }
    /**
     * Updates the URL hash to hide or show the specified GitHub repo
     */
    toggleRepo(account, repo, hidden) {
        if (hidden) {
            this._hide.add(repo.full_name);
        }
        else {
            this._hide.delete(repo.full_name);
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
     * Returns a URL hash string that matches the Hash object
     */
    toString() {
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
        if (this.options.delay && this.options.delay !== defaultDelay) {
            params.append("delay", String(this.options.delay));
        }
        let hashString = params.toString();
        // Don't encode common characters that are valid in the hash
        hashString = hashString.replace(/%2C/g, ",");
        hashString = hashString.replace(/%2F/g, "/");
        return hashString;
    }
    /**
     * Updates the URL hash to match the Hash object
     */
    _updateHash() {
        location.hash = this.toString();
    }
    /**
     * Updates the Hash object to match the URL hash
     */
    _handleHashChange() {
        let actualHash = location.hash.substr(1);
        let expectedHash = this.toString();
        if (actualHash !== expectedHash) {
            let params = new URLSearchParams(location.hash.substr(1));
            parseStringSet(params.get("u"), this._accounts);
            parseStringSet(params.get("hide"), this._hide);
            this._options.forks = parseBoolean(params.get("forks"), this._options.forks);
            this._options.delay = parsePositiveInteger(params.get("delay"), this._options.delay);
            this.dispatchEvent(new Event("hashchange"));
        }
    }
}
exports.Hash = Hash;
/**
 * The singleton instance of the Hash class.
 */
exports.hash = new Hash();
/**
 * Updates the contents of the given Set object to match the contents of
 * the specified comma-delimited string
 */
function parseStringSet(value, set) {
    set.clear();
    if (value) {
        let strings = value.split(",");
        for (let string of strings) {
            string = string.trim();
            if (string.length > 0) {
                set.add(string);
            }
        }
    }
}
/**
 * Parses a boolean string
 */
function parseBoolean(value, defaultValue = false) {
    if (!value) {
        return defaultValue;
    }
    else {
        return ["yes", "true", "on", "ok", "show"].includes(value.toLowerCase());
    }
}
/**
 * Parses a numeric string.  It can be a float or integer, positive or negative.
 */
function parseNumber(value, defaultValue = 0) {
    let number = parseFloat(value);
    return isNaN(number) ? defaultValue : number;
}
/**
 * Parses an integer string.  It can be positive or negative.
 */
function parseInteger(value, defaultValue = 0) {
    let number = parseNumber(value, defaultValue);
    return Number.isSafeInteger(number) ? number : Math.round(number);
}
/**
 * Parses a positive integer string.  It can be positive or zero.
 */
function parsePositiveInteger(value, defaultValue = 0) {
    let number = parseInteger(value, defaultValue);
    return number >= 0 ? number : defaultValue;
}
},{"./util":14}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app/app");
ReactDOM.render(React.createElement(app_1.App, null), document.body);
},{"./components/app/app":5}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
exports.LOCAL_DEV_MODE = location.hostname === "localhost";
/**
 * Converts a Map-like object to a POJO with string keys
 */
function mapToPOJO(map) {
    let pojo = {};
    for (let [key, value] of map.entries()) {
        pojo[key.toString()] = value;
    }
    return pojo;
}
exports.mapToPOJO = mapToPOJO;
/**
 * Returns a random number between min and max, inclusive.
 */
function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.random = random;
/**
 * Returns a CSS class string that indicates the number of accounts.
 */
function accountCountCssClass(accounts) {
    switch (accounts.size) {
        case 0:
            return "no-accounts";
        case 1:
            return "has-accounts has-one-account";
        default:
            return "has-accounts has-multiple-accounts";
    }
}
exports.accountCountCssClass = accountCountCssClass;
},{}]},{},[13])
//# sourceMappingURL=my-repos.js.map
