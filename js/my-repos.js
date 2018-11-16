/*!
 * My Repos v0.2.1 (November 16th 2018)
 * 
 * https://myrepos.io/
 * 
 * @author  James Messinger (https://jamesmessinger.com)
 * @license MIT
 */
/*!
 * My Repos v0.2.1 (November 16th 2018)
 * 
 * https://myrepos.io/
 * 
 * @author  James Messinger (https://jamesmessinger.com)
 * @license MIT
 */
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("./state-store");
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
        await cacheResponse(input, response);
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
async function artificialDelay() {
    let milliseconds = 0;
    if (state_store_1.stateStore.state.delay) {
        milliseconds = util_1.random(0, state_store_1.stateStore.state.delay);
    }
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
},{"./state-store":17,"./util":19}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repo_list_1 = require("./repo-list");
function AccountItem(props) {
    let { account } = props;
    return (React.createElement("section", { key: account.login, className: "account" },
        React.createElement("header", null,
            React.createElement("h1", null,
                React.createElement("a", { href: account.html_url },
                    account.avatar_url && React.createElement("img", { src: account.avatar_url, className: "avatar" }),
                    account.name))),
        React.createElement(AccountItemContents, Object.assign({}, props))));
}
exports.AccountItem = AccountItem;
function AccountItemContents(props) {
    let { account } = props;
    if (account.repos.length > 0) {
        return React.createElement(repo_list_1.RepoList, { account: account });
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
},{"./repo-list":8}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const account_item_1 = require("./account-item");
function AccountList() {
    let { accounts } = state_store_1.stateStore.state;
    return (React.createElement("main", { id: "account_list", className: util_1.accountCountCssClass(accounts) },
        React.createElement("div", { className: "responsive-container" }, accounts.map((account) => React.createElement(account_item_1.AccountItem, { account: account })))));
}
exports.AccountList = AccountList;
},{"../state-store":17,"../util":19,"./account-item":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
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
                await state_store_1.stateStore.addAccount(this.state.login);
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
},{"../state-store":17}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const account_list_1 = require("./account-list");
const first_time_1 = require("./first-time");
const page_header_1 = require("./page-header");
class App extends React.Component {
    constructor(props) {
        super(props);
        // Connect the StateStore with this app instance
        this.state = state_store_1.stateStore.state;
        state_store_1.stateStore.onStateChange((event) => this.setState(event.detail.state, event.detail.callback)); //tslint:disable-line:no-unbound-method
    }
    render() {
        return [
            React.createElement(page_header_1.PageHeader, { key: "page_header" }),
            // <Options key="options" />,
            React.createElement(account_list_1.AccountList, { key: "account_list" }),
            React.createElement(first_time_1.FirstTime, { key: "first_time" }),
        ];
    }
}
exports.App = App;
},{"../state-store":17,"./account-list":3,"./first-time":6,"./page-header":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const add_account_1 = require("./add-account");
function FirstTime() {
    let { accounts } = state_store_1.stateStore.state;
    return (React.createElement("aside", { id: "first_time", className: util_1.accountCountCssClass(accounts) },
        React.createElement("div", { className: "responsive-container" },
            React.createElement("div", { className: "welcome-message" },
                React.createElement("h3", null, "Hi! \uD83D\uDC4B Enter your GitHub username to get started"),
                React.createElement(add_account_1.AddAccount, { submitButtonText: "Show My Repos" })))));
}
exports.FirstTime = FirstTime;
},{"../state-store":17,"../util":19,"./add-account":4}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const add_account_1 = require("./add-account");
function PageHeader() {
    let { accounts } = state_store_1.stateStore.state;
    return (React.createElement("header", { id: "page_header", className: util_1.accountCountCssClass(accounts) },
        React.createElement("div", { className: "responsive-container" },
            React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
            React.createElement("h1", null, "My GitHub Repos"),
            React.createElement("h2", null, "All your GitHub repos on one page"),
            React.createElement(add_account_1.AddAccount, null))));
}
exports.PageHeader = PageHeader;
},{"../state-store":17,"../util":19,"./add-account":4}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
function RepoList(props) {
    let { account } = props;
    let repos = account.repos.filter((repo) => !state_store_1.stateStore.isHidden(repo));
    return (React.createElement("ul", { className: "repo-list" }, repos.map((repo) => React.createElement(RepoItem, Object.assign({ repo: repo }, props)))));
}
exports.RepoList = RepoList;
function RepoItem(props) {
    let { repo } = props;
    return (React.createElement("li", { key: repo.name, className: `repo ${repo.fork ? "forked" : ""} ${repo.archived ? "archived" : ""}` },
        React.createElement("h2", null,
            React.createElement("a", { href: repo.html_url }, repo.name)),
        repo.description && React.createElement("h3", null, repo.description),
        React.createElement("nav", { className: "badges" },
            React.createElement("a", { href: `${repo.html_url}/network/members`, className: `badge ${repo.forks_count ? "badge-ok" : ""} forks` },
                React.createElement("i", { className: "glyphicon glyphicon-cutlery" }),
                React.createElement("span", { className: "badge-label" }, "Forks"),
                React.createElement("span", { className: "badge-count" }, repo.forks_count)),
            React.createElement("a", { href: `${repo.html_url}/stargazers`, className: `badge ${repo.stargazers_count ? "badge-ok" : ""} stars` },
                React.createElement("i", { className: "glyphicon glyphicon-star" }),
                React.createElement("span", { className: "badge-label" }, "Stars"),
                React.createElement("span", { className: "badge-count" }, repo.stargazers_count)),
            React.createElement("a", { href: `${repo.html_url}/watchers`, className: `badge ${repo.watchers_count ? "badge-ok" : ""} watchers` },
                React.createElement("i", { className: "glyphicon glyphicon-eye-open" }),
                React.createElement("span", { className: "badge-label" }, "Watchers"),
                React.createElement("span", { className: "badge-count" }, repo.watchers_count)),
            React.createElement("a", { href: `${repo.html_url}/issues`, className: `badge ${repo.open_issues_count ? "badge-warning" : "badge-ok"} issues` },
                React.createElement("i", { className: "glyphicon glyphicon-fire" }),
                React.createElement("span", { className: "badge-label" }, "Issues"),
                React.createElement("span", { className: "badge-count" }, repo.open_issues_count)),
            DependencyBadge(props))));
}
function DependencyBadge(props) {
    let { repo } = props;
    let hasError;
    let label;
    let count;
    if (repo.dependencies.out_of_date) {
        hasError = true;
        label = "Out of Date";
        count = repo.dependencies.out_of_date;
    }
    else if (repo.dependencies.advisories) {
        hasError = true;
        label = "Insecure";
        count = repo.dependencies.advisories;
    }
    else {
        hasError = false;
        label = "Up-to-Date";
        count = repo.dependencies.up_to_date;
    }
    return (React.createElement("a", { href: repo.dependencies.html_url, className: `badge ${hasError ? "badge-error" : "badge-ok"} dependencies` },
        React.createElement("i", { className: "glyphicon glyphicon-calendar" }),
        React.createElement("span", { className: "badge-label" }, label),
        React.createElement("span", { className: "badge-count" }, `${count} / ${repo.dependencies.total}`)));
}
},{"../state-store":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Additional GitHub account properties that we need for this app
 */
class GitHubAccount {
    constructor(props = {}) {
        this.login = "";
        this.name = "";
        this.avatar_url = "";
        this.bio = "";
        this.html_url = "";
        /**
         * This account's GitHub repos
         */
        this.repos = [];
        /**
         * Indicates whether we're currently fetching the account info from GitHub
         */
        this.loading = false;
        /**
         * Indicates whether we've fetched the account info from GitHub
         * - regardless of whether it succeeded or failed
         */
        this.loaded = false;
        Object.assign(this, props);
    }
}
exports.GitHubAccount = GitHubAccount;
// tslint:disable:no-any no-unsafe-any
function isGitHubAccountPOJO(account) {
    return typeof account === "object" &&
        "login" in account && typeof account.login === "string" &&
        "name" in account && typeof account.name === "string" &&
        "bio" in account && typeof account.bio === "string" &&
        "avatar_url" in account && typeof account.avatar_url === "string";
}
exports.isGitHubAccountPOJO = isGitHubAccountPOJO;
},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Additional GitHub repo properties that we need for this app
 */
class GitHubRepo {
    constructor(props) {
        this.name = "";
        this.full_name = "";
        this.description = "";
        this.archived = false;
        this.fork = false;
        this.forks_count = 0;
        this.stargazers_count = 0;
        this.watchers_count = 0;
        this.open_issues_count = 0;
        this.html_url = "";
        // TEMPORARY
        this.dependencies = {
            total: 0,
            out_of_date: 0,
            up_to_date: 0,
            advisories: 0,
            html_url: "",
        };
        if (!props.account) {
            throw new Error(`No parent account was specified for GitHub repo "${props.name}"`);
        }
        this.account = props.account;
        Object.assign(this, props);
    }
}
exports.GitHubRepo = GitHubRepo;
// tslint:disable:no-any no-unsafe-any
function isArrayOfGitHubRepoPOJO(repos) {
    return repos.length > 0 &&
        typeof repos[0] === "object" &&
        typeof repos[0].name === "string";
}
exports.isArrayOfGitHubRepoPOJO = isArrayOfGitHubRepoPOJO;
},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("../api-client");
const github_account_1 = require("./github-account");
const github_repo_1 = require("./github-repo");
class GitHub {
    constructor() {
        this._client = new api_client_1.ApiClient();
    }
    /**
     * Fetches the specified GitHub account's info, NOT including its repos
     */
    async fetchAccount(account) {
        let accountPOJO = await this._client.fetchObject(`https://api.github.com/users/${account.login}`);
        if (github_account_1.isGitHubAccountPOJO(accountPOJO)) {
            return new github_account_1.GitHubAccount({
                ...accountPOJO,
                loading: false,
                loaded: true,
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
        if (github_repo_1.isArrayOfGitHubRepoPOJO(repoPOJOs)) {
            let repos = [];
            for (let repoPOJO of repoPOJOs) {
                repos.push(new github_repo_1.GitHubRepo({ ...repoPOJO, account }));
            }
            return repos;
        }
        else {
            throw this._client.createError("Invalid GitHub repo:", repoPOJOs);
        }
    }
}
exports.GitHub = GitHub;
},{"../api-client":1,"./github-account":9,"./github-repo":10}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("./github");
/**
 * Singleton instance of the GitHub API client
 */
exports.github = new github_1.GitHub();
},{"./github":11}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app");
ReactDOM.render(React.createElement(app_1.App, null), document.body);
},{"./components/app":5}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
class AppState {
    /**
     * Creates a new AppState instance, optionally cloning an existing state
     */
    constructor(props = {}) {
        this.accounts = props.accounts ? props.accounts.slice() : [];
        this.hiddenRepos = props.hiddenRepos ? new Set(props.hiddenRepos) : new Set();
        this.showForks = Boolean(props.showForks);
        this.showArchived = Boolean(props.showArchived);
        this.delay = props.delay || util_1.DEFAULT_DELAY;
    }
}
exports.AppState = AppState;
},{"../util":19}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("../github");
const github_account_1 = require("../github/github-account");
/**
 * Fetches the specified GitHub account and its repos, and then calls the given callback function
 * to update the app state.
 */
async function fetchGitHubAccount(account, callback) {
    // Fetch the GitHub account and repos at the same time
    let safeResults = await Promise.all([
        safeResolve(github_1.github.fetchAccount(account)),
        safeResolve(github_1.github.fetchRepos(account)),
    ]);
    // @ts-ignore - This line totally confuses the TypeScript compiler
    let [{ result: accountPOJO, error: accountError }, { result: repos, error: repoError }] = safeResults;
    if (accountError) {
        // An error occurred while fetching the account
        account = new github_account_1.GitHubAccount({
            ...account,
            error: accountError.message,
        });
    }
    else {
        // We successfully fetched the GitHub account
        account = new github_account_1.GitHubAccount(accountPOJO);
        if (repoError) {
            // An error occurred while fetching the repos, so add the error message to the account
            account.error = repoError.message;
        }
        else {
            // We successfully fetched the GitHub repos
            account.repos = repos;
        }
    }
    callback(account);
}
exports.fetchGitHubAccount = fetchGitHubAccount;
async function safeResolve(promise) {
    let result;
    let error;
    try {
        result = await promise;
    }
    catch (err) {
        error = err;
    }
    return { result, error };
}
},{"../github":12,"../github/github-account":9}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
/**
 * Updates the URL hash to match the specified app state
 */
function writeStateToHash(state) {
    let hash = stateToHash(state);
    let currentHash = location.hash.substr(1);
    if (hash !== currentHash) {
        location.hash = hash;
    }
}
exports.writeStateToHash = writeStateToHash;
/**
 * Returns an AppState instance that matches the current URL hash
 */
function readStateFromHash() {
    let hash = location.hash.substr(1);
    let state = hashToState(hash);
    return state;
}
exports.readStateFromHash = readStateFromHash;
/**
 * Determines whether the current URL hash matches the specified app state
 */
function hashMatchesState(state) {
    let actualHash = location.hash.substr(1);
    let expectedHash = stateToHash(state);
    return actualHash === expectedHash;
}
exports.hashMatchesState = hashMatchesState;
/**
 * Serializes the specified app state as a URL hash string
 */
function stateToHash(state) {
    let params = new URLSearchParams();
    if (state.accounts && state.accounts.length > 0) {
        params.append("u", state.accounts.map(util_1.getLogin).join(","));
    }
    if (state.hiddenRepos && state.hiddenRepos.size > 0) {
        params.append("hide", [...state.hiddenRepos].sort().join(","));
    }
    if (state.showForks) {
        params.append("forks", "yes");
    }
    if (state.showArchived) {
        params.append("archived", "yes");
    }
    if (state.delay !== util_1.DEFAULT_DELAY) {
        params.append("delay", String(state.delay));
    }
    let hashString = params.toString();
    // Don't encode common characters that are valid in the hash
    hashString = hashString.replace(/%2C/g, ",");
    hashString = hashString.replace(/%2F/g, "/");
    return hashString;
}
/**
 * Deserializes an AppState instance from the specified URL hash string
 */
function hashToState(hash) {
    let params = new URLSearchParams(hash);
    let state = {
        accounts: parseAccounts(params.get("u")),
        hiddenRepos: parseStringSet(params.get("hide")),
        showForks: parseBoolean(params.get("forks")),
        showArchived: parseBoolean(params.get("archived")),
        delay: parsePositiveInteger(params.get("delay"), util_1.DEFAULT_DELAY),
    };
    return state;
}
/**
 * Parses a comma-delimited string as an array of GitHub accounts
 */
function parseAccounts(value) {
    let logins = parseStringSet(value);
    if (logins) {
        let accounts = [];
        for (let login of logins.values()) {
            accounts.push({
                login,
                name: login,
            });
        }
        return accounts;
    }
}
/**
 * Parses a comma-delimited string as a Set of strings
 */
function parseStringSet(value) {
    value = value ? value.trim() : "";
    if (value) {
        let set = new Set();
        let strings = value.split(",");
        for (let string of strings) {
            string = string.trim();
            if (string.length > 0) {
                set.add(string);
            }
        }
        return set;
    }
}
/**
 * Parses a boolean string
 */
function parseBoolean(value, defaultValue = false) {
    value = value ? value.trim() : "";
    if (value) {
        let boolean = ["yes", "true", "on", "ok", "show"].includes(value.toLowerCase());
        if (boolean !== defaultValue) {
            return boolean;
        }
    }
}
/**
 * Parses a numeric string.  It can be a float or integer, positive or negative.
 */
function parseNumber(value, defaultValue = 0) {
    value = value ? value.trim() : "";
    let number = parseFloat(value);
    if (!isNaN(number) && number !== defaultValue) {
        return number;
    }
}
/**
 * Parses an integer string.  It can be positive or negative.
 */
function parseInteger(value, defaultValue = 0) {
    value = value ? value.trim() : "";
    let number = parseNumber(value);
    if (typeof number === "number") {
        number = Number.isSafeInteger(number) ? number : Math.round(number);
        if (number !== defaultValue) {
            return number;
        }
    }
}
/**
 * Parses a positive integer string.  It can be positive or zero.
 */
function parsePositiveInteger(value, defaultValue = 0) {
    value = value ? value.trim() : "";
    let number = parseInteger(value);
    if (typeof number === "number") {
        if (number >= 0 && number !== defaultValue) {
            return number;
        }
    }
}
},{"../util":19}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("./state-store");
/**
 * Singleton instance of the StateStore class
 */
exports.stateStore = new state_store_1.StateStore();
},{"./state-store":18}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_account_1 = require("../github/github-account");
const app_state_1 = require("./app-state");
const fetch_github_account_1 = require("./fetch-github-account");
const hash_1 = require("./hash");
const hashchange = "hashchange";
const statechange = "statechange";
class StateStore extends EventTarget {
    constructor() {
        super();
        this.state = new app_state_1.AppState();
        // Initialize the state from the URL hash
        this.syncWithHash();
        // Update the state whenever the hash changes
        window.addEventListener(hashchange, () => this.syncWithHash());
    }
    /**
     * Subscribes to the "statechange" event
     */
    onStateChange(listener) {
        this.addEventListener(statechange, listener);
    }
    /**
     * Dispatches a "statechange" event
     */
    setState(partialState, callback) {
        Object.assign(this.state, partialState);
        let stateChangeEvent = new CustomEvent(statechange, {
            detail: {
                state: this.state,
                callback: () => {
                    hash_1.writeStateToHash(this.state);
                    callback && callback(); //tslint:disable-line:no-void-expression
                }
            }
        });
        this.dispatchEvent(stateChangeEvent);
    }
    /**
     * Updates the state to match the URL hash
     */
    syncWithHash() {
        if (hash_1.hashMatchesState(this.state)) {
            // The URL hash is already in-sync with the app state
            return;
        }
        let hashState = hash_1.readStateFromHash();
        let state = new app_state_1.AppState(this.state);
        // Merge the URL hash state with the current app state
        hashState.hiddenRepos && (state.hiddenRepos = hashState.hiddenRepos);
        typeof hashState.showForks === "boolean" && (state.showForks = hashState.showForks);
        typeof hashState.showArchived === "boolean" && (state.showArchived = hashState.showArchived);
        typeof hashState.delay === "number" && (state.delay = hashState.delay);
        // Re-order the accounts to match the hash order
        if (hashState.accounts) {
            let accounts = state.accounts;
            state.accounts = [];
            for (let hashAccount of hashState.accounts) {
                let account = accounts.find(byLogin(hashAccount.login));
                if (account) {
                    state.accounts.push(account);
                }
                else {
                    // This is a newly-added account
                    account = new github_account_1.GitHubAccount({ ...hashAccount, loading: true });
                    state.accounts.push(account);
                    // Fetch the account info from GitHub
                    // tslint:disable-next-line:no-floating-promises
                    fetch_github_account_1.fetchGitHubAccount(account, (updated) => this.updateAccount(updated));
                }
            }
        }
        this.setState(state);
    }
    /**
     * Determines whether the specified account already exists
     */
    hasAccount(login) {
        if (typeof login === "object") {
            login = login.login;
        }
        return Boolean(this.getAccount(login));
    }
    /**
     * Returns the account with the specified login
     */
    getAccount(login) {
        return this.state.accounts.find(byLogin(login));
    }
    /**
     * Adds a new GitHub account with the specified login to the accounts list,
     * and asynchronously fetches the account info from GitHub
     */
    async addAccount(login) {
        login = login.trim();
        if (this.hasAccount(login)) {
            // The account already exists
            return;
        }
        let account = new github_account_1.GitHubAccount({
            login,
            name: login,
            loading: true,
        });
        // Add this account
        let accounts = this.state.accounts.slice();
        accounts.push(account);
        this.setState({ accounts });
        // Fetch the account info from GitHub
        await fetch_github_account_1.fetchGitHubAccount(account, (updated) => this.updateAccount(updated));
    }
    /**
     * Removes the specified GitHub account from the accounts list
     */
    updateAccount(account) {
        let accounts = this.state.accounts.slice();
        let index = accounts.findIndex(byLogin(account.login));
        if (index >= 0) {
            accounts.splice(index, 1, account);
            this.setState({ accounts });
        }
    }
    /**
     * Removes the specified GitHub account from the accounts list
     */
    removeAccount(account) {
        let accounts = this.state.accounts.slice();
        let index = accounts.findIndex(byLogin(account.login));
        if (index >= 0) {
            accounts.splice(index, 1);
            this.setState({ accounts });
        }
    }
    /**
     * Adds or removes the specified GitHub repo from the `hiddenRepos` list
     */
    toggleHidden(repo, hidden) {
        let hiddenRepos = new Set(this.state.hiddenRepos);
        if (hidden) {
            hiddenRepos.add(repo.full_name);
        }
        else {
            hiddenRepos.delete(repo.full_name);
        }
        this.setState({ hiddenRepos });
    }
    /**
     * Determines whether the GitHub Repo is current hidden
     */
    isHidden(repo) {
        if (this.state.hiddenRepos.has(repo.full_name)) {
            // This repo has been explicitly hidden
            return true;
        }
        if (repo.fork && !this.state.showForks) {
            // Don't show forked repos
            return true;
        }
        if (repo.archived && !this.state.showArchived) {
            // Don't show archived repos
            return true;
        }
        return false;
    }
}
exports.StateStore = StateStore;
/**
 * Used to find GitHub accounts by their "login" property
 */
function byLogin(login) {
    login = login.trim().toLowerCase();
    return (obj) => obj.login.trim().toLowerCase() === login;
}
},{"../github/github-account":9,"./app-state":14,"./fetch-github-account":15,"./hash":16}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
exports.LOCAL_DEV_MODE = location.hostname === "localhost";
// The default delay, based on whether we're in "local dev" mode
exports.DEFAULT_DELAY = exports.LOCAL_DEV_MODE ? 1000 : 0;
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
    switch (accounts.length) {
        case 0:
            return "no-accounts";
        case 1:
            return "has-accounts has-one-account";
        default:
            return "has-accounts has-multiple-accounts";
    }
}
exports.accountCountCssClass = accountCountCssClass;
/**
 * Returns the `login` property of the given object
 */
function getLogin(obj) {
    return obj.login;
}
exports.getLogin = getLogin;
},{}]},{},[13])
//# sourceMappingURL=my-repos.js.map
