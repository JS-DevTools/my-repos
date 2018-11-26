/*!
 * My Repos v0.4.0 (November 26th 2018)
 * 
 * https://myrepos.io/
 * 
 * @author  James Messinger (https://jamesmessinger.com)
 * @license MIT
 */
/*!
 * My Repos v0.4.0 (November 26th 2018)
 * 
 * https://myrepos.io/
 * 
 * @author  James Messinger (https://jamesmessinger.com)
 * @license MIT
 */
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const api_response_1 = require("./api-response");
/**
 * A wrapper around the Fetch API, with automatic response parsing, error-handling, and network latency immitation.
 */
class ApiClient {
    /**
     * Sends the given HTTP Request, and maps the response to the desired data type using the given
     * mapper function.
     *
     * NOTE: Unlike the native Fetch API, this will never throw an error.  If an error occurs, then
     * the `ApiResponse.error` property will be set.
     */
    async fetch(request, mapper) {
        let [response] = await Promise.all([
            await this._fetch(request, mapper),
            artificialDelay(),
        ]);
        return response;
    }
    /**
     * Fetches the requested HTTP resource from the LocalStorage cache if possible.
     * If there is no cached response, then perform a real HTTP fetch.
     * This helps avoid hitting API rate limits.
     *
     * NOTE: Unlike the native Fetch API, this will never throw an error.  If an error occurs, then
     * the `ApiResponse.error` property will be set.
     */
    async _fetch(request, mapper) {
        try {
            let fromCache;
            // Try to get the response from the cache first
            let rawResponse = this._fetchFromCache(request);
            if (rawResponse) {
                fromCache = true;
            }
            else {
                fromCache = false;
                // Unable to retrieve from cache, so perform a real HTTP fetch
                rawResponse = await fetch(request);
                if (rawResponse.ok) {
                    // Cache the raw Response
                    await this._cacheResponse(rawResponse);
                }
            }
            // Convert teh raw Fetch Response to an ApiResponse
            return api_response_1.ApiResponse.fromRaw(rawResponse, fromCache, mapper);
        }
        catch (error) {
            // Create a dummy response and set the `error` property
            let rawResponse = new Response(error.message, {
                status: 503,
                statusText: "Service Unavailable",
                headers: {
                    "Content-Type": "text/plain",
                }
            });
            return api_response_1.ApiResponse.fromRaw(rawResponse, false, mapper);
        }
    }
    /**
     * Returns the specified HTTP resource from the LocalStorage cache, if it exists.
     */
    _fetchFromCache(request) {
        // See if we have a cached response for this resource
        let cache = localStorage.getItem(request.url);
        if (cache) {
            try {
                // Re-hydrate the cached Fetch Response object
                let { body, ...init } = JSON.parse(cache);
                return new Response(body, init);
            }
            catch (error) {
                // The cached response is invalid, so delete it from LocalStorage
                localStorage.removeItem(request.url);
            }
        }
    }
    /**
     * Caches the given response
     */
    async _cacheResponse(response) {
        // Convert the response to a POJO that can be serialized as JSON
        let responsePOJO = {
            status: response.status,
            statusText: response.statusText,
            headers: util_1.mapToPOJO(response.headers),
            body: await response.clone().text(),
        };
        // Cache the response POJO as JSON in LocalStorage
        localStorage.setItem(response.url, JSON.stringify(responsePOJO, undefined, 2));
    }
}
exports.ApiClient = ApiClient;
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

},{"../state-store":23,"../util":25,"./api-response":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
class ApiError extends Error {
    constructor(url, message, responseBody) {
        message = `${url} ${message}`;
        if (responseBody) {
            message += `\n${util_1.prettify(responseBody)}`;
        }
        super(message);
        this.url = url;
    }
}
exports.ApiError = ApiError;

},{"../util":25}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const api_error_1 = require("./api-error");
/**
 * A Fetch Response object with a typed body
 */
class ApiResponse {
    constructor(props) {
        Object.assign(this, props);
    }
    /**
     * Creates an ApiResponse object from the given Fetch Response body
     */
    static async fromRaw(rawResponse, fromCache, mapper) {
        let { ok, url, status, statusText } = rawResponse;
        let error;
        let body;
        let headers = {};
        try {
            // Parse the headers, even if it's an error response
            headers = util_1.mapToPOJO(rawResponse.headers); // tslint:disable-line:no-any
            // Parse the body, even if it's an error response, since the body may contain error details
            let rawBody = await parseResponseBody(rawResponse);
            if (ok) {
                // Try to map the response body to the desired type
                body = mapper(rawBody);
            }
            else {
                error = new api_error_1.ApiError(url, `returned an HTTP ${status} (${statusText || "Error"}) response`, rawBody);
            }
        }
        catch (err) {
            error = err;
        }
        // If an error occurred, then the response is not OK
        ok = ok && !error;
        return new ApiResponse({ ok, error, status, statusText, url, fromCache, headers, body });
    }
}
exports.ApiResponse = ApiResponse;
async function parseResponseBody(rawResponse) {
    try {
        // Try parsing the response as JSON first
        return await rawResponse.clone().json();
    }
    catch (error) {
        // Unable to parse as JSON
    }
    try {
        // Try parsing the response as text
        return await rawResponse.clone().text();
    }
    catch (error) {
        // Unable to parse as Text
    }
    return undefined;
}

},{"../util":25,"./api-error":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const virtual_dom_1 = require("../virtual-dom");
const repo_list_1 = require("./repo-list");
function AccountItem(props) {
    let { account } = props;
    return (virtual_dom_1.h("section", { key: account.login, class: "account" },
        virtual_dom_1.h("header", null,
            virtual_dom_1.h("h1", null,
                virtual_dom_1.h("a", { href: account.html_url },
                    account.avatar_url && virtual_dom_1.h("img", { src: account.avatar_url, class: "avatar" }),
                    account.name))),
        virtual_dom_1.h(AccountItemContents, Object.assign({}, props))));
}
exports.AccountItem = AccountItem;
function AccountItemContents(props) {
    let { account } = props;
    if (account.repos.length > 0) {
        return virtual_dom_1.h(repo_list_1.RepoList, { account: account });
    }
    else if (account.error) {
        return (virtual_dom_1.h("div", { class: "error" },
            virtual_dom_1.h("div", { class: "error-message" }, account.error)));
    }
    else if (account.loading) {
        return (virtual_dom_1.h("div", { class: "loading" },
            virtual_dom_1.h("div", { class: "loading-message" }, "Loading...")));
    }
    else {
        return (virtual_dom_1.h("div", { class: "no-repos" },
            virtual_dom_1.h("div", { class: "empty-message" }, "There are no repos to show")));
    }
}

},{"../virtual-dom":29,"./repo-list":11}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const virtual_dom_1 = require("../virtual-dom");
const account_item_1 = require("./account-item");
function AccountList() {
    let { accounts } = state_store_1.stateStore.state;
    return (virtual_dom_1.h("main", { id: "account_list", class: util_1.accountCountCssClass(accounts) },
        virtual_dom_1.h("div", { class: "responsive-container" }, accounts.map((account) => virtual_dom_1.h(account_item_1.AccountItem, { account: account })))));
}
exports.AccountList = AccountList;

},{"../state-store":23,"../util":25,"../virtual-dom":29,"./account-item":4}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const virtual_dom_1 = require("../virtual-dom");
class AddAccount extends virtual_dom_1.Component {
    constructor() {
        super(...arguments);
        this.login = "";
        this.handleChange = (event) => {
            let textInput = event.target;
            this.login = textInput.value;
        };
        this.handleSubmit = async (event) => {
            event.preventDefault();
            if (this.login) {
                state_store_1.stateStore.addAccount(this.login);
            }
        };
    }
    render() {
        let { submitButtonText } = this.props;
        let { login } = this;
        return (virtual_dom_1.h("form", { class: "add-account form", onsubmit: this.handleSubmit },
            virtual_dom_1.h("dl", { class: "form-group" },
                virtual_dom_1.h("dt", { class: "input-label" },
                    virtual_dom_1.h("label", { htmlFor: "repo_owner" }, "GitHub Username")),
                virtual_dom_1.h("dd", { class: "input-field" },
                    virtual_dom_1.h("input", { type: "text", name: "account_name", class: "form-control short", maxLength: 100, autofocus: true, autocapitalize: "off", autocomplete: "on", spellcheck: false, placeholder: "GitHub Username", value: login, onchange: this.handleChange }))),
            virtual_dom_1.h("button", { type: "submit", class: "btn btn-primary" }, submitButtonText || "Add")));
    }
}
exports.AddAccount = AddAccount;

},{"../state-store":23,"../virtual-dom":29}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const virtual_dom_1 = require("../virtual-dom");
const account_list_1 = require("./account-list");
const first_time_1 = require("./first-time");
const options_1 = require("./options");
const page_header_1 = require("./page-header");
function App() {
    return [
        virtual_dom_1.h(page_header_1.PageHeader, { key: "page_header" }),
        virtual_dom_1.h(options_1.Options, { key: "options" }),
        virtual_dom_1.h(account_list_1.AccountList, { key: "account_list" }),
        virtual_dom_1.h(first_time_1.FirstTime, { key: "first_time" }),
    ];
}
exports.App = App;

},{"../virtual-dom":29,"./account-list":5,"./first-time":8,"./options":9,"./page-header":10}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const virtual_dom_1 = require("../virtual-dom");
const add_account_1 = require("./add-account");
function FirstTime() {
    let { accounts } = state_store_1.stateStore.state;
    return (virtual_dom_1.h("aside", { id: "first_time", class: util_1.accountCountCssClass(accounts) },
        virtual_dom_1.h("div", { class: "responsive-container" },
            virtual_dom_1.h("div", { class: "welcome-message" },
                virtual_dom_1.h("h3", null, "Hi! \uD83D\uDC4B Enter your GitHub username to get started"),
                virtual_dom_1.h(add_account_1.AddAccount, { submitButtonText: "Show My Repos" })))));
}
exports.FirstTime = FirstTime;

},{"../state-store":23,"../util":25,"../virtual-dom":29,"./add-account":6}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const virtual_dom_1 = require("../virtual-dom");
function Options() {
    let { accounts, showForks, showArchived } = state_store_1.stateStore.state;
    let hasForks = false, hasArchived = false;
    for (let account of accounts) {
        for (let repo of account.repos) {
            hasForks = hasForks || repo.fork;
            hasArchived = hasArchived || repo.archived;
        }
    }
    if (!hasForks && !hasArchived) {
        return null; // tslint:disable-line:no-null-keyword
    }
    return (virtual_dom_1.h("div", { class: "responsive-container" },
        virtual_dom_1.h("aside", { id: "options" },
            hasForks &&
                virtual_dom_1.h("a", { id: "toggle_forks", href: `#forks=${showForks ? "hide" : "show"}`, onclick: handleOptionClick },
                    showForks ? "hide" : "show",
                    " forks"),
            hasArchived &&
                virtual_dom_1.h("a", { id: "toggle_archived", href: `#archived=${showArchived ? "hide" : "show"}`, onclick: handleOptionClick },
                    showArchived ? "hide" : "show",
                    " archived"))));
}
exports.Options = Options;
function handleOptionClick(event) {
    event.preventDefault();
    let clickedElement = event.currentTarget;
    switch (clickedElement.id) {
        case "toggle_forks":
            state_store_1.stateStore.setState({ showForks: !state_store_1.stateStore.state.showForks });
            break;
        case "toggle_archived":
            state_store_1.stateStore.setState({ showArchived: !state_store_1.stateStore.state.showArchived });
            break;
    }
}

},{"../state-store":23,"../virtual-dom":29}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("../state-store");
const util_1 = require("../util");
const virtual_dom_1 = require("../virtual-dom");
const add_account_1 = require("./add-account");
function PageHeader() {
    let { accounts } = state_store_1.stateStore.state;
    return (virtual_dom_1.h("header", { id: "page_header", class: util_1.accountCountCssClass(accounts) },
        virtual_dom_1.h("div", { class: "responsive-container" },
            virtual_dom_1.h("img", { class: "logo", src: "img/logo.png", alt: "logo image" }),
            virtual_dom_1.h("h1", null, "My GitHub Repos"),
            virtual_dom_1.h("h2", null, "All your GitHub repos on one page"),
            virtual_dom_1.h(add_account_1.AddAccount, null))));
}
exports.PageHeader = PageHeader;

},{"../state-store":23,"../util":25,"../virtual-dom":29,"./add-account":6}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const octicons = require("octicons");
const state_store_1 = require("../state-store");
const virtual_dom_1 = require("../virtual-dom");
function RepoList(props) {
    let { account } = props;
    let repos = account.repos.filter((repo) => !state_store_1.stateStore.isHidden(repo));
    return (virtual_dom_1.h("ul", { class: "repo-list" }, repos.map((repo) => virtual_dom_1.h(RepoItem, Object.assign({ repo: repo }, props)))));
}
exports.RepoList = RepoList;
function RepoItem(props) {
    let { repo } = props;
    return (virtual_dom_1.h("li", { key: repo.name, class: `repo ${repo.fork ? "forked" : ""} ${repo.archived ? "archived" : ""}` },
        virtual_dom_1.h("h2", null,
            virtual_dom_1.h("a", { href: repo.html_url }, repo.name)),
        repo.description && virtual_dom_1.h("h3", null, repo.description),
        virtual_dom_1.h("nav", { class: "badges" },
            virtual_dom_1.h("a", { href: `${repo.html_url}/network/members`, class: `badge ${repo.forks_count ? "badge-ok" : ""} forks` },
                virtual_dom_1.h(Octicon, { name: "repo-forked" }),
                virtual_dom_1.h("span", { class: "badge-label" }, "Forks"),
                virtual_dom_1.h("span", { class: "badge-count" }, String(repo.forks_count))),
            virtual_dom_1.h("a", { href: `${repo.html_url}/stargazers`, class: `badge ${repo.stargazers_count ? "badge-ok" : ""} stars` },
                virtual_dom_1.h(Octicon, { name: "star" }),
                virtual_dom_1.h("span", { class: "badge-label" }, "Stars"),
                virtual_dom_1.h("span", { class: "badge-count" }, String(repo.stargazers_count))),
            virtual_dom_1.h("a", { href: `${repo.html_url}/watchers`, class: `badge ${repo.watchers_count ? "badge-ok" : ""} watchers` },
                virtual_dom_1.h(Octicon, { name: "eye" }),
                virtual_dom_1.h("span", { class: "badge-label" }, "Watchers"),
                virtual_dom_1.h("span", { class: "badge-count" }, String(repo.watchers_count))),
            virtual_dom_1.h("a", { href: `${repo.html_url}/issues`, class: `badge ${repo.open_issues_count ? "badge-warning" : "badge-ok"} issues` },
                virtual_dom_1.h(Octicon, { name: repo.open_issues_count ? "issue-opened" : "issue-closed" }),
                virtual_dom_1.h("span", { class: "badge-label" }, "Issues"),
                virtual_dom_1.h("span", { class: "badge-count" }, String(repo.open_issues_count))),
            virtual_dom_1.h(DependencyBadge, Object.assign({}, props)))));
}
function Octicon({ name }) {
    let icon = octicons[name];
    // @ts-ignore - SVGSVGElement's properties are objects, not primitives
    return virtual_dom_1.h("svg", Object.assign({}, icon.options, { innerHTML: icon.path }));
}
function DependencyBadge(props) {
    let { repo } = props;
    if (repo.dependencies.total === 0) {
        // The repo has dependencies, so don't show this badge
        return null; // tslint:disable-line:no-null-keyword
    }
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
    return (virtual_dom_1.h("a", { href: repo.dependencies.html_url, class: `badge ${hasError ? "badge-error" : "badge-ok"} dependencies` },
        virtual_dom_1.h(Octicon, { name: "package" }),
        virtual_dom_1.h("span", { class: "badge-label" }, label),
        virtual_dom_1.h("span", { class: "badge-count" }, `${count} / ${repo.dependencies.total}`)));
}

},{"../state-store":23,"../virtual-dom":29,"octicons":36}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Additional GitHub account properties that we need for this app
 */
class GitHubAccount {
    constructor(props = {}) {
        this.login = "";
        this.name = "";
        this.bio = "";
        this.avatar_url = "";
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
    return account &&
        typeof account === "object" &&
        typeof account.login === "string" &&
        account.login.length > 0 &&
        typeof account.name === "string" &&
        account.name.length > 0 &&
        typeof account.bio === "string" &&
        typeof account.avatar_url === "string" &&
        typeof account.html_url === "string";
}
exports.isGitHubAccountPOJO = isGitHubAccountPOJO;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dependencies_1 = require("../package-registry/dependencies");
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
        this.open_pulls_count = 0;
        this.issues_includes_pulls = true;
        this.language = "";
        this.html_url = "";
        this.dependencies = new dependencies_1.Dependencies();
        if (!props.account) {
            throw new Error(`No parent account was specified for GitHub repo "${props.name}"`);
        }
        this.account = props.account;
        Object.assign(this, props);
    }
}
exports.GitHubRepo = GitHubRepo;
// tslint:disable:no-any no-unsafe-any
function isGitHubRepoPOJO(repo) {
    return repo &&
        typeof repo === "object" &&
        typeof repo.name === "string" &&
        repo.name.length > 0 &&
        typeof repo.full_name === "string" &&
        repo.full_name.length > 0 &&
        typeof repo.html_url === "string";
}
exports.isGitHubRepoPOJO = isGitHubRepoPOJO;

},{"../package-registry/dependencies":17}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("../api-client/api-client");
const api_error_1 = require("../api-client/api-error");
const api_response_1 = require("../api-client/api-response");
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
        let request = new Request(`https://api.github.com/users/${account.login}`);
        return this._client.fetch(request, (responseBody) => {
            // tslint:disable-next-line:strict-type-predicates
            if (typeof responseBody !== "object") {
                throw new api_error_1.ApiError(request.url, "did not return a JSON object as expected", responseBody);
            }
            else if (Array.isArray(responseBody)) {
                throw new api_error_1.ApiError(request.url, "returned a JSON array, but a JSON object was expected", responseBody);
            }
            else if (!github_account_1.isGitHubAccountPOJO(responseBody)) {
                throw new api_error_1.ApiError(request.url, "returned an invalid GitHub account", responseBody);
            }
            // Convert the response body to a GitHubAccount object
            return new github_account_1.GitHubAccount({
                ...responseBody,
                loading: false,
                loaded: true,
                repos: [],
            });
        });
    }
    /**
     * Fetches the GitHub repos for the specified account, NOT including pull requests
     */
    async fetchRepos(account) {
        let request = new Request(`https://api.github.com/users/${account.login}/repos`);
        return this._client.fetch(request, (responseBody) => {
            if (!Array.isArray(responseBody)) {
                throw new api_error_1.ApiError(request.url, "did not return a JSON array as expected", responseBody);
            }
            let repos = [];
            for (let repo of responseBody) {
                if (github_repo_1.isGitHubRepoPOJO(repo)) {
                    repos.push(new github_repo_1.GitHubRepo({ ...repo, account }));
                }
                else {
                    throw new api_error_1.ApiError(request.url, "returned an invalid GitHub repo", repo);
                }
            }
            return repos;
        });
    }
    /**
     * Fetches the number of open pull requests for the specified GitHub repo.
     * This is necessary because the `open_issues_count` field on the GitHubRepo object
     * actually includes open issues AND open PRs.
     */
    async fetchPullCount(repo) {
        let rawResponse = new Response();
        return api_response_1.ApiResponse.fromRaw(rawResponse, false, () => 0);
    }
}
exports.GitHub = GitHub;

},{"../api-client/api-client":1,"../api-client/api-error":2,"../api-client/api-response":3,"./github-account":12,"./github-repo":13}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("./github");
/**
 * Singleton instance of the GitHub API client
 */
exports.github = new github_1.GitHub();

},{"./github":14}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app");
const state_store_1 = require("./state-store");
const virtual_dom_1 = require("./virtual-dom");
let app = app_1.App();
document.body.innerHTML = "";
virtual_dom_1.mountTo(document.body, app);
state_store_1.stateStore.onStateChange((event) => {
    let oldApp = app;
    let newApp = app_1.App();
    virtual_dom_1.patch(document.body, oldApp, newApp);
});

},{"./components/app":7,"./state-store":23,"./virtual-dom":29}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Dependencies {
    constructor() {
        this.total = 0;
        this.out_of_date = 0;
        this.up_to_date = 0;
        this.advisories = 0;
        this.html_url = "";
    }
}
exports.Dependencies = Dependencies;

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const package_registry_1 = require("./package-registry");
/**
 * Singleton instance of the PackageRegistry API client
 */
exports.packageRegistry = new package_registry_1.PackageRegistry();

},{"./package-registry":19}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("../api-client/api-client");
const api_response_1 = require("../api-client/api-response");
const dependencies_1 = require("./dependencies");
class PackageRegistry {
    constructor() {
        this._client = new api_client_1.ApiClient();
    }
    /**
     * Fetches the dependencies for the specified GitHub repo
     */
    async fetchDependencies(repo) {
        if (repo.language !== "JavaScript" && repo.language !== "TypeScript") {
            // Not yet implemented for this language
        }
        let rawResponse = new Response();
        return api_response_1.ApiResponse.fromRaw(rawResponse, false, () => new dependencies_1.Dependencies());
    }
}
exports.PackageRegistry = PackageRegistry;

},{"../api-client/api-client":1,"../api-client/api-response":3,"./dependencies":17}],20:[function(require,module,exports){
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

},{"../util":25}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("../github");
const github_account_1 = require("../github/github-account");
const github_repo_1 = require("../github/github-repo");
const package_registry_1 = require("../package-registry");
/**
 * Begins fetching all the data for the specified GitHub account.  This function returns immediately,
 * but the data is fetched asynchronously, and the specified update callbacks are called as data
 * is received.
 */
function fetchData(account, updateAccount, updateRepo) {
    fetchDataAsync(account, updateAccount, updateRepo)
        .catch((error) => {
        account.error = error.message;
        updateAccount(account);
    });
}
exports.fetchData = fetchData;
/**
 * Fetches all the data for the specified GitHub account.  This requires several API calls,
 * and the specified update callback will be called multiple times.
 */
async function fetchDataAsync(account, updateAccount, updateRepo) {
    // Fetch the account and repos simultaneously
    account = await fetchAccountAndRepos(account);
    // Immediately update the app state with the account & repo info
    updateAccount(account);
    // Fetch additional data for each repo
    await Promise.all(account.repos.map((repo) => fetchRepoData(repo, updateRepo)));
    // TODO: Perform a second-pass without cache
}
exports.fetchDataAsync = fetchDataAsync;
/**
 * Fetches the specified GitHub account and its repos
 */
async function fetchAccountAndRepos(account) {
    // Fetch the GitHub account and repos at the same time
    let [accountResponse, reposResponse] = await Promise.all([
        github_1.github.fetchAccount(account),
        github_1.github.fetchRepos(account),
    ]);
    if (accountResponse.error) {
        // An error occurred while fetching the account
        account = new github_account_1.GitHubAccount({
            ...account,
            error: accountResponse.error.message,
        });
    }
    else {
        // We successfully fetched the GitHub account
        account = accountResponse.body;
        if (reposResponse.error) {
            // An error occurred while fetching the repos, so add the error message to the account
            account.error = reposResponse.error.message;
        }
        else {
            // We successfully fetched the GitHub repos
            account.repos = reposResponse.body;
        }
    }
    return account;
}
/**
 * Fetches the issues, pull requests, and dependencies for the specified repo.
 * The specified update callback is called as each piece of data is received.
 */
async function fetchRepoData(repo, updateRepo) {
    // Fetch the issues, pull requests, and dependencies at the same time,
    // and call the update callback as each piece of data is received
    await Promise.all([
        fetchIssuesAndPullRequests(repo, updateRepo),
        fetchDependencies(repo, updateRepo),
    ]);
}
/**
 * Fetches the issues and pull requests for the specified repo,
 * and calls the specified update callback.
 */
async function fetchIssuesAndPullRequests(repo, updateRepo) {
    let prCountResponse = await github_1.github.fetchPullCount(repo);
    if (prCountResponse.ok) {
        let open_pulls_count = prCountResponse.body;
        let { open_issues_count, issues_includes_pulls } = repo;
        if (issues_includes_pulls) {
            // The `open_issues_count` field actually includes open issues AND open PRs.
            // So remove the PRs from the count
            open_issues_count = open_issues_count - open_pulls_count;
            issues_includes_pulls = false;
        }
        // Update the app state with the "correct" numbers
        repo = new github_repo_1.GitHubRepo({
            ...repo,
            open_issues_count,
            open_pulls_count,
            issues_includes_pulls,
        });
        updateRepo(repo);
    }
}
/**
 * Fetches the dependencies for the specified repo, and calls the specified update callback.
 */
async function fetchDependencies(repo, updateRepo) {
    let dependenciesResponse = await package_registry_1.packageRegistry.fetchDependencies(repo);
    if (dependenciesResponse.ok) {
        // Update the app state with the repo's dependencies
        repo = new github_repo_1.GitHubRepo({
            ...repo,
            dependencies: dependenciesResponse.body,
        });
        updateRepo(repo);
    }
}

},{"../github":15,"../github/github-account":12,"../github/github-repo":13,"../package-registry":18}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_account_1 = require("../github/github-account");
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
    let accounts = [];
    for (let login of logins.values()) {
        accounts.push(new github_account_1.GitHubAccount({
            login,
            name: login,
        }));
    }
    return accounts;
}
/**
 * Parses a comma-delimited string as a Set of strings
 */
function parseStringSet(value) {
    value = value ? value.trim() : "";
    let set = new Set();
    if (value) {
        let strings = value.split(",");
        for (let string of strings) {
            string = string.trim();
            if (string.length > 0) {
                set.add(string);
            }
        }
    }
    return set;
}
/**
 * Parses a boolean string
 */
function parseBoolean(value, defaultValue = false) {
    value = value ? value.trim() : "";
    let boolean = ["yes", "true", "on", "ok", "show"].includes(value.toLowerCase());
    if (boolean === defaultValue) {
        return defaultValue;
    }
    else {
        return boolean;
    }
}
/**
 * Parses a numeric string.  It can be a float or integer, positive or negative.
 */
function parseNumber(value, defaultValue = 0) {
    value = value ? value.trim() : "";
    let number = parseFloat(value);
    if (isNaN(number) || number === defaultValue) {
        return defaultValue;
    }
    else {
        return number;
    }
}
/**
 * Parses an integer string.  It can be positive or negative.
 */
function parseInteger(value, defaultValue = 0) {
    value = value ? value.trim() : "";
    let number = parseNumber(value, defaultValue);
    number = Number.isSafeInteger(number) ? number : Math.round(number);
    if (number === defaultValue) {
        return defaultValue;
    }
    else {
        return number;
    }
}
/**
 * Parses a positive integer string.  It can be positive or zero.
 */
function parsePositiveInteger(value, defaultValue = 0) {
    value = value ? value.trim() : "";
    let number = parseInteger(value, defaultValue);
    if (number < 0 || number === defaultValue) {
        return defaultValue;
    }
    else {
        return number;
    }
}

},{"../github/github-account":12,"../util":25}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_store_1 = require("./state-store");
/**
 * Singleton instance of the StateStore class
 */
exports.stateStore = new state_store_1.StateStore();

},{"./state-store":24}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_account_1 = require("../github/github-account");
const app_state_1 = require("./app-state");
const fetch_data_1 = require("./fetch-data");
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
     * Updates the state and dispatches a "statechange" event
     */
    setState(partialState) {
        // Update the state
        Object.assign(this.state, partialState);
        hash_1.writeStateToHash(this.state);
        // Call any event handlers
        let stateChangeEvent = new CustomEvent(statechange);
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
        // Re-order the accounts to match the hash order
        if (hashState.accounts) {
            let hashAccounts = hashState.accounts;
            hashState.accounts = [];
            for (let hashAccount of hashAccounts) {
                let account = this.getAccount(hashAccount.login);
                if (account) {
                    hashState.accounts.push(account);
                }
                else {
                    // This is a newly-added account
                    hashState.accounts.push(hashAccount);
                    hashAccount.loading = true;
                    // Start fetching the account's data from GitHub, David-DM, etc.
                    this._fetchData(hashAccount);
                }
            }
        }
        this.setState(hashState);
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
     * and starts fetching the account data
     */
    addAccount(login) {
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
        // Fetch the account's data from GitHub, David-DM, etc.
        this._fetchData(account);
    }
    /**
     * Updates the specified GitHub account
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
     * Updates the specified GitHub repo
     */
    updateRepo(repo) {
        let accounts = this.state.accounts.slice();
        let account = accounts.find(byLogin(repo.account.login));
        if (account) {
            let index = account.repos.findIndex(byName(repo.name));
            if (index >= 0) {
                account.repos.splice(index, 1, repo);
                this.setState({ accounts });
            }
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
    /**
     * Begins fetching all the data for the specified GitHub account. This function returns immediately,
     * but the data is fetched asynchronously, and the `updateAccount()` and `updateRepo()` callbacks
     * are called as data is received.
     */
    _fetchData(account) {
        let updateAccount = this.updateAccount.bind(this);
        let updateRepo = this.updateRepo.bind(this);
        fetch_data_1.fetchData(account, updateAccount, updateRepo);
    }
}
exports.StateStore = StateStore;
/**
 * Used to find GitHub accounts by their "login" property
 */
function byLogin(login) {
    login = login.trim().toLowerCase();
    return (account) => account.login.trim().toLowerCase() === login;
}
/**
 * Used to find GitHub repos by their "name" property
 */
function byName(name) {
    name = name.trim().toLowerCase();
    return (repo) => repo.name.trim().toLowerCase() === name;
}

},{"../github/github-account":12,"./app-state":20,"./fetch-data":21,"./hash":22}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// When running on localhost, we introduce artificial delays
// and use LocalStorage instead of Fetch, to avoid rate limits
exports.LOCAL_DEV_MODE = location.hostname === "localhost";
// The default delay, based on whether we're in "local dev" mode
exports.DEFAULT_DELAY = exports.LOCAL_DEV_MODE ? 1000 : 0;
exports.SVG_NAMESPACE = "http://www.w3.org/2000/svg";
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
 * Returns the given value as a pretty-formatted string
 */
function prettify(value) {
    // tslint:disable-next-line:strict-type-predicates
    if (value && typeof value === "object") {
        return JSON.stringify(value, undefined, 2);
    }
    else {
        return String(value);
    }
}
exports.prettify = prettify;
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

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Component {
    constructor(props, children) {
        this.props = props || {};
        this.children = children || [];
    }
    // tslint:disable-next-line:no-empty
    onUnmount() { }
}
exports.Component = Component;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Flattens a possibly-nested array of VirtualNodes, and removes any nulls
 */
function flattenNodes(nodes) {
    let flattened = [];
    if (Array.isArray(nodes)) {
        for (let node of nodes) {
            if (node) {
                flattened.push(...flattenNodes(node));
            }
        }
    }
    else if (nodes) {
        flattened.push(nodes);
    }
    return flattened;
}
exports.flattenNodes = flattenNodes;

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:unified-signatures
const component_1 = require("./component");
const emptyArray = Object.freeze([]);
const emptyObject = Object.freeze({});
/**
 * Creates a VirtualNode object.  Children are converted to VirtualNodes, if necessary.
 */
function h(tagOrFactory, props, ...children) {
    props = props || emptyObject;
    let childNodes = createChildNodes(children);
    switch (typeof tagOrFactory) {
        case "string":
            return {
                tag: tagOrFactory,
                props,
                children: childNodes,
            };
        case "function":
            if (tagOrFactory.prototype instanceof component_1.Component) {
                let Class = tagOrFactory;
                let component = new Class(props, childNodes);
                let node = component.render();
                if (node) {
                    node.component = component;
                }
                return node;
            }
            else {
                let factory = tagOrFactory;
                return factory(props, childNodes);
            }
        default:
            throw new TypeError(`Invalid node type: ${typeof tagOrFactory}`);
    }
}
exports.h = h;
/**
 * Filters and converts children to VirtualNodes, if necessary.
 */
function createChildNodes(children) {
    if (children.length === 0) {
        return emptyArray;
    }
    let childNodes = [];
    for (let child of children) {
        if (child) {
            switch (typeof child) {
                case "string":
                    childNodes.push({ text: child });
                    break;
                case "object":
                    if (Array.isArray(child)) {
                        let nodes = createChildNodes(child);
                        childNodes.push(...nodes);
                    }
                    else {
                        childNodes.push(child);
                    }
                    break;
                default:
                    throw new TypeError(`Invalid child node type: ${typeof child}`);
            }
        }
    }
    return childNodes;
}

},{"./component":26}],29:[function(require,module,exports){
"use strict";
/**
 * Yes, I know I'm reinventing the wheel here.  There are already plenty of virtual DOM implementations,
 * and certainly plenty of ones that are better than this one.  This implemenation only has the
 * functionality that's needed by this app, which makes it lightweight and optimized.  But mostly
 * I just wanted the experience of writing a vdom. 😊
 */
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
exports.Component = component_1.Component;
var h_1 = require("./h");
exports.h = h_1.h;
var mount_1 = require("./mount");
exports.mount = mount_1.mount;
exports.mountTo = mount_1.mountTo;
var patch_1 = require("./patch");
exports.patch = patch_1.patch;
var unmount_1 = require("./unmount");
exports.unmount = unmount_1.unmount;
exports.unmountFrom = unmount_1.unmountFrom;

},{"./component":26,"./h":28,"./mount":30,"./patch":31,"./unmount":33}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const flatten_nodes_1 = require("./flatten-nodes");
const set_prop_1 = require("./set-prop");
/**
 * Creates actual DOM Nodes from VirtualNodes, and adds them as children of the specifid DOM element
 */
function mountTo(parent, children, isSVG = false) {
    isSVG = isSVG || parent.namespaceURI === util_1.SVG_NAMESPACE;
    for (let child of flatten_nodes_1.flattenNodes(children)) {
        let domNode = mount(child, isSVG);
        parent.appendChild(domNode);
    }
}
exports.mountTo = mountTo;
/**
 * Creates an actual DOM Node from the given VirtualNode
 */
function mount(node, isSVG = false) {
    if ("text" in node) {
        // Create a DOM text node
        node.domNode = document.createTextNode(node.text);
    }
    else {
        isSVG = isSVG || node.tag === "svg";
        // Create the DOM element
        if (isSVG) {
            node.domNode = document.createElementNS(util_1.SVG_NAMESPACE, node.tag);
        }
        else {
            node.domNode = document.createElement(node.tag);
        }
        // Set the element's properties and attributes
        for (let [key, value] of Object.entries(node.props)) {
            set_prop_1.setProp(node.domNode, key, value);
        }
        // Mount child nodes to the newly-created element
        mountTo(node.domNode, node.children, isSVG);
    }
    return node.domNode;
}
exports.mount = mount;

},{"../util":25,"./flatten-nodes":27,"./set-prop":32}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const flatten_nodes_1 = require("./flatten-nodes");
const mount_1 = require("./mount");
const set_prop_1 = require("./set-prop");
const unmount_1 = require("./unmount");
function patch(parent, oldChildren, newChildren, isSVG = false) {
    isSVG = isSVG || parent.namespaceURI === util_1.SVG_NAMESPACE;
    let nodePairs = matchNodes(flatten_nodes_1.flattenNodes(oldChildren), flatten_nodes_1.flattenNodes(newChildren));
    for (let [oldNode, newNode] of nodePairs) {
        if (oldNode && newNode) {
            if (isSameType(oldNode, newNode)) {
                updateNode(oldNode, newNode, isSVG);
            }
            else {
                replaceNode(parent, oldNode, newNode, isSVG);
            }
        }
        else if (newNode) {
            mount_1.mountTo(parent, newNode, isSVG);
        }
        else {
            unmount_1.unmountFrom(parent, oldNode);
        }
    }
}
exports.patch = patch;
function updateNode(oldNode, newNode, isSVG) {
    // The same DOM Node now represents a different VirtualNode
    newNode.domNode = oldNode.domNode;
    // Simple logic for text nodes
    if ("text" in oldNode || "text" in newNode) {
        let oldText = oldNode.text;
        let newText = newNode.text;
        if (oldText !== newText) {
            oldNode.domNode.nodeValue = newText;
        }
        return;
    }
    // Update each property that has changed
    for (let [key, value] of Object.entries(newNode.props)) {
        let oldValue = oldNode.props[key];
        if (value !== oldValue) {
            set_prop_1.setProp(newNode.domNode, key, value);
        }
    }
    // Unset any props that were previous set but aren't anymore
    for (let key in oldNode.props) {
        if (!(key in newNode.props)) {
            set_prop_1.setProp(newNode.domNode, key, undefined);
        }
    }
    // Patch grandchildren
    if (oldNode.children.length > 0 || newNode.children.length > 0) {
        patch(newNode.domNode, oldNode.children, newNode.children, isSVG);
    }
}
function replaceNode(parent, oldNode, newNode, isSVG) {
    unmount_1.unmount(oldNode);
    mount_1.mount(newNode, isSVG);
    parent.replaceChild(newNode.domNode, oldNode.domNode);
}
function isSameType(nodeA, nodeB) {
    if ("text" in nodeA && "text" in nodeB) {
        // They're both text nodes
        return true;
    }
    else if ("text" in nodeA || "text" in nodeB) {
        // One is a text node, but not the other
        return false;
    }
    else {
        // Are they the same HTML tag?
        return nodeA.tag === nodeB.tag;
    }
}
function getKey(node, index) {
    if (!node) {
        return index;
    }
    if ("text" in node) {
        return node.text;
    }
    else {
        return node.props.key || index;
    }
}
function matchNodes(oldNodes, newNodes) {
    let pairs = [];
    for (let i = 0; i < oldNodes.length; i++) {
        let oldNode = oldNodes[i];
        let oldKey = getKey(oldNode, i);
        let matchFound = false;
        for (let j = 0; j < newNodes.length; j++) {
            let newNode = newNodes[j];
            let newKey = getKey(newNode, j);
            if (oldKey === newKey) {
                matchFound = true;
                pairs.push([oldNode, newNode]);
                // Remove this node from the array so it won't be paired again.
                // Setting it to undefined ensures that the index of other nodes remain the same.
                // tslint:disable-next-line:no-any
                newNodes[j] = undefined;
                break;
            }
        }
        if (!matchFound) {
            pairs.push([oldNode, undefined]);
        }
    }
    // Any remaining newNodes have no corresponding oldNode
    for (let newNode of newNodes) {
        if (newNode) {
            pairs.push([undefined, newNode]);
        }
    }
    return pairs;
}

},{"../util":25,"./flatten-nodes":27,"./mount":30,"./set-prop":32,"./unmount":33}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knownProps = new Set([
    "className", "value", "checked", "selected", "innerHTML"
]);
/**
 * Updates the specified property or attribute of the given DOM Element.
 */
function setProp(element, key, value) {
    if (isProperty(key, value)) {
        element[key] = value;
    }
    else {
        if (value === true) {
            element.setAttribute(key, "");
        }
        else if (value === false) {
            element.removeAttribute(key);
        }
        else {
            element.setAttribute(key, String(value));
        }
    }
}
exports.setProp = setProp;
function isProperty(key, value) {
    if (knownProps.has(key) || key.startsWith("on")) {
        return true;
    }
    let type = typeof value;
    return value && (type === "object" || type === "function");
}

},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flatten_nodes_1 = require("./flatten-nodes");
/**
 * Removes the actual DOM Nodes that correspond to the specified VirtualNodes
 */
function unmountFrom(parent, nodes) {
    for (let node of flatten_nodes_1.flattenNodes(nodes)) {
        unmount(node);
        parent.removeChild(node.domNode);
    }
}
exports.unmountFrom = unmountFrom;
/**
 * Triggers the "onUnload" logic for the given VirtualNode and its descendants
 */
function unmount(node) {
    if ("children" in node) {
        for (let child of node.children) {
            unmount(child);
        }
    }
    if ("component" in node) {
        node.component.onUnmount();
    }
    node.domNode = undefined;
}
exports.unmount = unmount;

},{"./flatten-nodes":27}],34:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],35:[function(require,module,exports){
module.exports={"plus":{"name":"plus","figma":{"id":"0:639","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["add","new","more"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 9H7v5H5V9H0V7h5V2h2v5h5v2z\"/>"},"primitive-dot":{"name":"primitive-dot","figma":{"id":"0:641","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["circle"],"width":8,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z\"/>"},"primitive-square":{"name":"primitive-square","figma":{"id":"0:643","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["box"],"width":8,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 12H0V4h8v8z\"/>"},"quote":{"name":"quote","figma":{"id":"0:655","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["quotation"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6.16 3.5C3.73 5.06 2.55 6.67 2.55 9.36c.16-.05.3-.05.44-.05 1.27 0 2.5.86 2.5 2.41 0 1.61-1.03 2.61-2.5 2.61-1.9 0-2.99-1.52-2.99-4.25 0-3.8 1.75-6.53 5.02-8.42L6.16 3.5zm7 0c-2.43 1.56-3.61 3.17-3.61 5.86.16-.05.3-.05.44-.05 1.27 0 2.5.86 2.5 2.41 0 1.61-1.03 2.61-2.5 2.61-1.89 0-2.98-1.52-2.98-4.25 0-3.8 1.75-6.53 5.02-8.42l1.14 1.84h-.01z\"/>"},"three-bars":{"name":"three-bars","figma":{"id":"0:826","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["hamburger","menu","dropdown"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11.41 9H.59C0 9 0 8.59 0 8c0-.59 0-1 .59-1H11.4c.59 0 .59.41.59 1 0 .59 0 1-.59 1h.01zm0-4H.59C0 5 0 4.59 0 4c0-.59 0-1 .59-1H11.4c.59 0 .59.41.59 1 0 .59 0 1-.59 1h.01zM.59 11H11.4c.59 0 .59.41.59 1 0 .59 0 1-.59 1H.59C0 13 0 12.59 0 12c0-.59 0-1 .59-1z\"/>"},"triangle-down":{"name":"triangle-down","figma":{"id":"0:847","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["arrow","point","direction"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 5l6 6 6-6H0z\"/>"},"triangle-left":{"name":"triangle-left","figma":{"id":"0:849","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["arrow","point","direction"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 2L0 8l6 6V2z\"/>"},"triangle-right":{"name":"triangle-right","figma":{"id":"0:851","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["arrow","point","direction"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 14l6-6-6-6v12z\"/>"},"triangle-up":{"name":"triangle-up","figma":{"id":"0:853","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["arrow","point","direction"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 11L6 5l-6 6h12z\"/>"},"kebab-horizontal":{"name":"kebab-horizontal","figma":{"id":"0:875","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["kebab","dot","menu","more"],"width":13,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM13 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z\"/>"},"kebab-vertical":{"name":"kebab-vertical","figma":{"id":"0:880","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["kebab","dot","menu","more"],"width":3,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 2.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm0 5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM1.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z\"/>"},"screen-full":{"name":"screen-full","figma":{"id":"0:898","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["fullscreen","expand"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 10h1v3c0 .547-.453 1-1 1h-3v-1h3v-3zM1 10H0v3c0 .547.453 1 1 1h3v-1H1v-3zm0-7h3V2H1c-.547 0-1 .453-1 1v3h1V3zm1 1h10v8H2V4zm2 6h6V6H4v4zm6-8v1h3v3h1V3c0-.547-.453-1-1-1h-3z\"/>"},"screen-normal":{"name":"screen-normal","figma":{"id":"0:906","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["fullscreen","expand","exit"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M2 4H0V3h2V1h1v2c0 .547-.453 1-1 1zm0 8H0v1h2v2h1v-2c0-.547-.453-1-1-1zm9-2c0 .547-.453 1-1 1H4c-.547 0-1-.453-1-1V6c0-.547.453-1 1-1h6c.547 0 1 .453 1 1v4zM9 7H5v2h4V7zm2 6v2h1v-2h2v-1h-2c-.547 0-1 .453-1 1zm1-10V1h-1v2c0 .547.453 1 1 1h2V3h-2z\"/>"},"x":{"name":"x","figma":{"id":"0:932","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["remove","close","delete"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z\"/>"},"grabber":{"name":"grabber","figma":{"id":"0:942","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["mover","drap","drop","sort"],"width":8,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 4v1H0V4h8zM0 8h8V7H0v1zm0 3h8v-1H0v1z\"/>"},"plus-small":{"name":"plus-small","figma":{"id":"0:947","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["add","new","more","small"],"width":7,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 4H3v3H0v1h3v3h1V8h3V7H4V4z\"/>"},"pulse":{"name":"pulse","figma":{"id":"0:645","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["graph","trend","line","activity"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11.5 8L8.8 5.4 6.6 8.5 5.5 1.6 2.38 8H0v2h3.6l.9-1.8.9 5.4L9 8.5l1.6 1.5H14V8h-2.5z\"/>"},"star":{"name":"star","figma":{"id":"0:781","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["save","remember","like"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z\"/>"},"stop":{"name":"stop","figma":{"id":"0:785","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["block","spam","report"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 1H4L0 5v6l4 4h6l4-4V5l-4-4zm3 9.5L9.5 14h-5L1 10.5v-5L4.5 2h5L13 5.5v5zM6 4h2v5H6V4zm0 6h2v2H6v-2z\"/>"},"sync":{"name":"sync","figma":{"id":"0:791","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["cycle","refresh","loop"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10.24 7.4a4.15 4.15 0 0 1-1.2 3.6 4.346 4.346 0 0 1-5.41.54L4.8 10.4.5 9.8l.6 4.2 1.31-1.26c2.36 1.74 5.7 1.57 7.84-.54a5.876 5.876 0 0 0 1.74-4.46l-1.75-.34zM2.96 5a4.346 4.346 0 0 1 5.41-.54L7.2 5.6l4.3.6-.6-4.2-1.31 1.26c-2.36-1.74-5.7-1.57-7.85.54C.5 5.03-.06 6.65.01 8.26l1.75.35A4.17 4.17 0 0 1 2.96 5z\"/>"},"text-size":{"name":"text-size","figma":{"id":"0:821","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["font","size","text"],"width":18,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13.62 9.08L12.1 3.66h-.06l-1.5 5.42h3.08zM5.7 10.13S4.68 6.52 4.53 6.02h-.08l-1.13 4.11H5.7zM17.31 14h-2.25l-.95-3.25h-4.07L9.09 14H6.84l-.69-2.33H2.87L2.17 14H0l3.3-9.59h2.5l2.17 6.34L10.86 2h2.52l3.94 12h-.01z\"/>"},"report":{"name":"report","figma":{"id":"0:885","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["report","abuse","flag"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7l-4 4v-4H1a1 1 0 0 1-1-1V2zm1 0h14v9H6.5L4 13.5V11H1V2zm6 6h2v2H7V8zm0-5h2v4H7V3z\"/>"},"link-external":{"name":"link-external","figma":{"id":"0:956","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["out","see","more","go","to"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11 10h1v3c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h3v1H1v10h10v-3zM6 2l2.25 2.25L5 7.5 6.5 9l3.25-3.25L12 8V2H6z\"/>"},"checklist":{"name":"checklist","figma":{"id":"0:108","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["todo","tasks"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16 8.5l-6 6-3-3L8.5 10l1.5 1.5L14.5 7 16 8.5zM5.7 12.2l.8.8H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v6.5l-.8-.8c-.39-.39-1.03-.39-1.42 0L5.7 10.8a.996.996 0 0 0 0 1.41v-.01zM4 4h5V3H4v1zm0 2h5V5H4v1zm0 2h3V7H4v1zM3 9H2v1h1V9zm0-2H2v1h1V7zm0-2H2v1h1V5zm0-2H2v1h1V3z\"/>"},"cloud-download":{"name":"cloud-download","figma":{"id":"0:152","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["save","install","get"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 12h2l-3 3-3-3h2V7h2v5zm3-8c0-.44-.91-3-4.5-3C5.08 1 3 2.92 3 5 1.02 5 0 6.52 0 8c0 1.53 1 3 3 3h3V9.7H3C1.38 9.7 1.3 8.28 1.3 8c0-.17.05-1.7 1.7-1.7h1.3V5c0-1.39 1.56-2.7 3.2-2.7 2.55 0 3.13 1.55 3.2 1.8v1.2H12c.81 0 2.7.22 2.7 2.2 0 2.09-2.25 2.2-2.7 2.2h-2V11h2c2.08 0 4-1.16 4-3.5C16 5.06 14.08 4 12 4z\"/>"},"cloud-upload":{"name":"cloud-upload","figma":{"id":"0:156","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["put","export"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 9H5l3-3 3 3H9v5H7V9zm5-4c0-.44-.91-3-4.5-3C5.08 2 3 3.92 3 6 1.02 6 0 7.52 0 9c0 1.53 1 3 3 3h3v-1.3H3c-1.62 0-1.7-1.42-1.7-1.7 0-.17.05-1.7 1.7-1.7h1.3V6c0-1.39 1.56-2.7 3.2-2.7 2.55 0 3.13 1.55 3.2 1.8v1.2H12c.81 0 2.7.22 2.7 2.2 0 2.09-2.25 2.2-2.7 2.2h-2V12h2c2.08 0 4-1.16 4-3.5C16 6.06 14.08 5 12 5z\"/>"},"fold":{"name":"fold","figma":{"id":"0:329","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["unfold","hide","collapse"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 9l3 3H8v3H6v-3H4l3-3zm3-6H8V0H6v3H4l3 3 3-3zm4 2c0-.55-.45-1-1-1h-2.5l-1 1h3l-2 2h-7l-2-2h3l-1-1H1c-.55 0-1 .45-1 1l2.5 2.5L0 10c0 .55.45 1 1 1h2.5l1-1h-3l2-2h7l2 2h-3l1 1H13c.55 0 1-.45 1-1l-2.5-2.5L14 5z\"/>"},"tasklist":{"name":"tasklist","figma":{"id":"0:800","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["todo"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15.41 9H7.59C7 9 7 8.59 7 8c0-.59 0-1 .59-1h7.81c.59 0 .59.41.59 1 0 .59 0 1-.59 1h.01zM9.59 4C9 4 9 3.59 9 3c0-.59 0-1 .59-1h5.81c.59 0 .59.41.59 1 0 .59 0 1-.59 1H9.59zM0 3.91l1.41-1.3L3 4.2 7.09 0 8.5 1.41 3 6.91l-3-3zM7.59 12h7.81c.59 0 .59.41.59 1 0 .59 0 1-.59 1H7.59C7 14 7 13.59 7 13c0-.59 0-1 .59-1z\"/>"},"history":{"name":"history","figma":{"id":"0:404","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["time","past","revert","back"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 13H6V6h5v2H8v5zM7 1C4.81 1 2.87 2.02 1.59 3.59L0 2v4h4L2.5 4.5C3.55 3.17 5.17 2.3 7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-.34.03-.67.09-1H.08C.03 7.33 0 7.66 0 8c0 3.86 3.14 7 7 7s7-3.14 7-7-3.14-7-7-7z\"/>"},"dash":{"name":"dash","figma":{"id":"0:178","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["hyphen","range"],"width":8,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 7v2h8V7H0z\"/>"},"list-ordered":{"name":"list-ordered","figma":{"id":"0:500","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["numbers","tasks","todo","items"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12.01 13c0 .59 0 1-.59 1H4.6c-.59 0-.59-.41-.59-1 0-.59 0-1 .59-1h6.81c.59 0 .59.41.59 1h.01zM4.6 4h6.81C12 4 12 3.59 12 3c0-.59 0-1-.59-1H4.6c-.59 0-.59.41-.59 1 0 .59 0 1 .59 1zm6.81 3H4.6c-.59 0-.59.41-.59 1 0 .59 0 1 .59 1h6.81C12 9 12 8.59 12 8c0-.59 0-1-.59-1zm-9.4-6h-.72c-.3.19-.58.25-1.03.34V2h.75v2.14H.17V5h2.84v-.86h-1V1zm.392 8.12c-.129 0-.592.04-.802.07.53-.56 1.14-1.25 1.14-1.89C2.72 6.52 2.18 6 1.38 6c-.59 0-.97.2-1.38.64l.58.58c.19-.19.38-.38.64-.38.28 0 .48.16.48.52 0 .53-.77 1.2-1.7 2.06V10h3v-.88h-.598zm-.222 3.79v-.03c.44-.19.64-.47.64-.86 0-.7-.56-1.11-1.44-1.11-.48 0-.89.19-1.28.52l.55.64c.25-.2.44-.31.69-.31.27 0 .42.13.42.36 0 .27-.2.44-.86.44v.75c.83 0 .98.17.98.47 0 .25-.23.38-.58.38-.28 0-.56-.14-.81-.38l-.48.66c.3.36.77.56 1.41.56.83 0 1.53-.41 1.53-1.16 0-.5-.31-.81-.77-.94v.01z\"/>"},"list-unordered":{"name":"list-unordered","figma":{"id":"0:508","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["bullet","point","tasks","todo","items"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M2 13c0 .59 0 1-.59 1H.59C0 14 0 13.59 0 13c0-.59 0-1 .59-1h.81c.59 0 .59.41.59 1H2zm2.59-9h6.81c.59 0 .59-.41.59-1 0-.59 0-1-.59-1H4.59C4 2 4 2.41 4 3c0 .59 0 1 .59 1zM1.41 7H.59C0 7 0 7.41 0 8c0 .59 0 1 .59 1h.81c.59 0 .59-.41.59-1 0-.59 0-1-.59-1h.01zm0-5H.59C0 2 0 2.41 0 3c0 .59 0 1 .59 1h.81c.59 0 .59-.41.59-1 0-.59 0-1-.59-1h.01zm10 5H4.59C4 7 4 7.41 4 8c0 .59 0 1 .59 1h6.81c.59 0 .59-.41.59-1 0-.59 0-1-.59-1h.01zm0 5H4.59C4 12 4 12.41 4 13c0 .59 0 1 .59 1h6.81c.59 0 .59-.41.59-1 0-.59 0-1-.59-1h.01z\"/>"},"reply":{"name":"reply","figma":{"id":"0:554","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["reply all","back"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 3.5c3.92.44 8 3.125 8 10-2.312-5.062-4.75-6-8-6V11L.5 5.5 6 0v3.5z\"/>"},"mute":{"name":"mute","figma":{"id":"0:599","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["quiet","sound","audio","turn","off"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 2.81v10.38c0 .67-.81 1-1.28.53L3 10H1c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h2l3.72-3.72C7.19 1.81 8 2.14 8 2.81zm7.53 3.22l-1.06-1.06-1.97 1.97-1.97-1.97-1.06 1.06L11.44 8 9.47 9.97l1.06 1.06 1.97-1.97 1.97 1.97 1.06-1.06L13.56 8l1.97-1.97z\"/>"},"comment-discussion":{"name":"comment-discussion","figma":{"id":"0:164","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["converse","talk"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15 1H6c-.55 0-1 .45-1 1v2H1c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h1v3l3-3h4c.55 0 1-.45 1-1V9h1l3 3V9h1c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zM9 11H4.5L3 12.5V11H1V5h4v3c0 .55.45 1 1 1h3v2zm6-3h-2v1.5L11.5 8H6V2h9v6z\"/>"},"comment":{"name":"comment","figma":{"id":"0:169","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["speak","bubble"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 1H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h2v3.5L7.5 11H14c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 9H7l-2 2v-2H2V2h12v8z\"/>"},"ellipsis":{"name":"ellipsis","figma":{"id":"0:249","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["dot","read","more","hidden","expand"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11 5H1c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zM4 9H2V7h2v2zm3 0H5V7h2v2zm3 0H8V7h2v2z\"/>"},"heart":{"name":"heart","figma":{"id":"0:400","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["love","beat"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 2c-.97 0-1.69.42-2.2 1-.51.58-.78.92-.8 1-.02-.08-.28-.42-.8-1-.52-.58-1.17-1-2.2-1-1.632.086-2.954 1.333-3 3 0 .52.09 1.52.67 2.67C1.25 8.82 3.01 10.61 6 13c2.98-2.39 4.77-4.17 5.34-5.33C11.91 6.51 12 5.5 12 5c-.047-1.69-1.342-2.913-3-3z\"/>"},"horizontal-rule":{"name":"horizontal-rule","figma":{"id":"0:412","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["hr"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M1 7h2v2h1V3H3v3H1V3H0v6h1V7zm9 2V7H9v2h1zm0-3V4H9v2h1zM7 6V4h2V3H6v6h1V7h2V6H7zm-7 7h10v-2H0v2z\"/>"},"info":{"name":"info","figma":{"id":"0:430","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["help"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z\"/>"},"italic":{"name":"italic","figma":{"id":"0:454","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["font","italic","style"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M2.81 5h1.98L3 14H1l1.81-9zm.36-2.7c0-.7.58-1.3 1.33-1.3.56 0 1.13.38 1.13 1.03 0 .75-.59 1.3-1.33 1.3-.58 0-1.13-.38-1.13-1.03z\"/>"},"unverified":{"name":"unverified","figma":{"id":"0:914","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["insecure","untrusted","signed"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16.65 7.507l-1.147-1.423a1.595 1.595 0 0 1-.33-.817l-.201-1.805a1.603 1.603 0 0 0-1.412-1.413l-1.806-.201a1.617 1.617 0 0 1-.828-.35L9.503.35a1.597 1.597 0 0 0-1.996 0L6.084 1.497c-.233.18-.51.297-.817.33l-1.805.201A1.603 1.603 0 0 0 2.049 3.44l-.201 1.805c-.032.319-.17.595-.35.829L.35 7.497a1.597 1.597 0 0 0 0 1.996l1.147 1.423c.18.233.297.51.33.817l.201 1.805a1.603 1.603 0 0 0 1.412 1.413l1.805.201c.319.032.595.17.829.35l1.423 1.148a1.597 1.597 0 0 0 1.996 0l1.423-1.147c.233-.18.51-.297.817-.33l1.805-.201a1.603 1.603 0 0 0 1.413-1.412l.201-1.806c.032-.318.17-.594.35-.828l1.148-1.423a1.597 1.597 0 0 0 0-1.996zm-7.083 4.715c0 .297-.233.53-.53.53H7.973a.532.532 0 0 1-.53-.53V11.16c0-.297.244-.531.53-.531h1.062c.298 0 .531.234.531.53v1.063zm1.657-5.193c-.064.18-.18.35-.319.5-.138.17-.149.201-.35.403a3.5 3.5 0 0 1-.553.478c-.116.095-.212.201-.297.286-.085.085-.148.18-.202.287a1.63 1.63 0 0 0-.116.319c-.032.116-.032.138-.032.265H7.582c0-.233 0-.329.031-.51.032-.201.085-.382.149-.552.064-.148.149-.297.265-.446.117-.138.245-.265.436-.403.287-.202.382-.319.51-.552.127-.234.212-.404.212-.627 0-.287-.064-.478-.212-.616-.139-.138-.33-.201-.616-.201-.096 0-.202.02-.319.053-.117.032-.18.095-.265.17-.085.074-.149.116-.213.212a.435.435 0 0 0-.095.297H5.34c0-.403.138-.594.287-.881.17-.287.382-.531.647-.712.266-.18.584-.318.935-.403a4.94 4.94 0 0 1 1.157-.138c.467 0 .882.053 1.243.138.36.096.669.234.934.414.244.18.435.404.584.67.138.265.202.583.202.933 0 .234 0 .446-.085.627l-.021-.01z\"/>"},"verified":{"name":"verified","figma":{"id":"0:919","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["trusted","secure","trustworthy","signed"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16.65 7.507l-1.147-1.423a1.595 1.595 0 0 1-.33-.817l-.201-1.805a1.603 1.603 0 0 0-1.412-1.413l-1.806-.201a1.617 1.617 0 0 1-.828-.35L9.503.35a1.597 1.597 0 0 0-1.996 0L6.084 1.497c-.233.18-.51.297-.817.33l-1.805.201A1.603 1.603 0 0 0 2.049 3.44l-.201 1.805c-.032.319-.17.595-.35.829L.35 7.497a1.597 1.597 0 0 0 0 1.996l1.147 1.423c.18.233.297.51.33.817l.201 1.805a1.603 1.603 0 0 0 1.412 1.413l1.805.201c.319.032.595.17.829.35l1.423 1.148a1.597 1.597 0 0 0 1.996 0l1.423-1.147c.233-.18.51-.297.817-.33l1.805-.201a1.603 1.603 0 0 0 1.413-1.412l.201-1.806c.032-.318.17-.594.35-.828l1.148-1.423a1.597 1.597 0 0 0 0-1.996zm-9.737 5.246L3.196 9.036 4.79 7.443l2.124 2.124 5.309-5.309 1.593 1.646-6.902 6.849z\"/>"},"question":{"name":"question","figma":{"id":"0:649","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["help","explain"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 10h2v2H6v-2zm4-3.5C10 8.64 8 9 8 9H6c0-.55.45-1 1-1h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V7H4c0-1.5 1.5-3 3-3s3 1 3 2.5zM7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z\"/>"},"unfold":{"name":"unfold","figma":{"id":"0:857","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["expand","open","reveal"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11.5 7.5L14 10c0 .55-.45 1-1 1H9v-1h3.5l-2-2h-7l-2 2H5v1H1c-.55 0-1-.45-1-1l2.5-2.5L0 5c0-.55.45-1 1-1h4v1H1.5l2 2h7l2-2H9V4h4c.55 0 1 .45 1 1l-2.5 2.5zM6 6h2V3h2L7 0 4 3h2v3zm2 3H6v3H4l3 3 3-3H8V9z\"/>"},"sign-in":{"name":"sign-in","figma":{"id":"0:764","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["door","arrow","direction","enter","log in"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 6.75V12h4V8h1v4c0 .55-.45 1-1 1H7v3l-5.45-2.72c-.33-.17-.55-.52-.55-.91V1c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v3h-1V1H3l4 2v2.25L10 3v2h4v2h-4v2L7 6.75z\"/>"},"sign-out":{"name":"sign-out","figma":{"id":"0:768","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["door","arrow","direction","leave","log out"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 9V7H8V5h4V3l4 3-4 3zm-2 3H6V3L2 1h8v3h1V1c0-.55-.45-1-1-1H1C.45 0 0 .45 0 1v11.38c0 .39.22.73.55.91L6 16.01V13h4c.55 0 1-.45 1-1V8h-1v4z\"/>"},"alert":{"name":"alert","figma":{"id":"0:5","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["warning","triangle","exclamation","point"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z\"/>"},"arrow-down":{"name":"arrow-down","figma":{"id":"0:8","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 7V3H3v4H0l5 6 5-6H7z\"/>"},"arrow-left":{"name":"arrow-left","figma":{"id":"0:10","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 3L0 8l6 5v-3h4V6H6V3z\"/>"},"arrow-right":{"name":"arrow-right","figma":{"id":"0:12","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 8L4 3v3H0v4h4v3l6-5z\"/>"},"arrow-up":{"name":"arrow-up","figma":{"id":"0:14","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M5 3L0 9h3v4h4V9h3L5 3z\"/>"},"arrow-both":{"name":"arrow-both","figma":{"id":"7345:13","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction","left","right"],"width":20,"height":16,"path":"<path d=\"M0 8l6-5v3h8V3l6 5-6 5v-3H6v3L0 8z\"/>"},"arrow-small-down":{"name":"arrow-small-down","figma":{"id":"0:16","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction","little","tiny"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 7V5H2v2H0l3 4 3-4H4z\"/>"},"arrow-small-left":{"name":"arrow-small-left","figma":{"id":"0:18","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction","little","tiny"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 7V5L0 8l4 3V9h2V7H4z\"/>"},"arrow-small-right":{"name":"arrow-small-right","figma":{"id":"0:20","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction","little","tiny"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 8L2 5v2H0v2h2v2l4-3z\"/>"},"arrow-small-up":{"name":"arrow-small-up","figma":{"id":"0:22","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["point","direction","little","tiny"],"width":6,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M3 5L0 9h2v2h2V9h2L3 5z\"/>"},"check":{"name":"check","figma":{"id":"0:104","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["mark","yes","confirm","accept","ok","success"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z\"/>"},"chevron-down":{"name":"chevron-down","figma":{"id":"0:117","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["triangle","arrow"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M5 11L0 6l1.5-1.5L5 8.25 8.5 4.5 10 6l-5 5z\"/>"},"chevron-left":{"name":"chevron-left","figma":{"id":"0:119","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["triangle","arrow"],"width":8,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M5.5 3L7 4.5 3.25 8 7 11.5 5.5 13l-5-5 5-5z\"/>"},"chevron-right":{"name":"chevron-right","figma":{"id":"0:121","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["triangle","arrow"],"width":8,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7.5 8l-5 5L1 11.5 4.75 8 1 4.5 2.5 3l5 5z\"/>"},"chevron-up":{"name":"chevron-up","figma":{"id":"0:123","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["triangle","arrow"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 10l-1.5 1.5L5 7.75 1.5 11.5 0 10l5-5 5 5z\"/>"},"circle-slash":{"name":"circle-slash","figma":{"id":"0:127","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["no","deny","fail","failure","error","bad"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 1.3c1.3 0 2.5.44 3.47 1.17l-8 8A5.755 5.755 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zm0 11.41c-1.3 0-2.5-.44-3.47-1.17l8-8c.73.97 1.17 2.17 1.17 3.47 0 3.14-2.56 5.7-5.7 5.7z\"/>"},"bold":{"name":"bold","figma":{"id":"0:38","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["markdown","bold","text"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M1 2h3.83c2.48 0 4.3.75 4.3 2.95 0 1.14-.63 2.23-1.67 2.61v.06c1.33.3 2.3 1.23 2.3 2.86 0 2.39-1.97 3.52-4.61 3.52H1V2zm3.66 4.95c1.67 0 2.38-.66 2.38-1.69 0-1.17-.78-1.61-2.34-1.61H3.13v3.3h1.53zm.27 5.39c1.77 0 2.75-.64 2.75-1.98 0-1.27-.95-1.81-2.75-1.81h-1.8v3.8h1.8v-.01z\"/>"},"mention":{"name":"mention","figma":{"id":"0:579","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["at","ping"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6.58 15c1.25 0 2.52-.31 3.56-.94l-.42-.94c-.84.52-1.89.83-3.03.83-3.23 0-5.64-2.08-5.64-5.72 0-4.37 3.23-7.18 6.58-7.18 3.45 0 5.22 2.19 5.22 5.2 0 2.39-1.34 3.86-2.5 3.86-1.05 0-1.36-.73-1.05-2.19l.73-3.75H8.98l-.11.72c-.41-.63-.94-.83-1.56-.83-2.19 0-3.66 2.39-3.66 4.38 0 1.67.94 2.61 2.3 2.61.84 0 1.67-.53 2.3-1.25.11.94.94 1.45 1.98 1.45 1.67 0 3.77-1.67 3.77-5C14 2.61 11.59 0 7.83 0 3.66 0 0 3.33 0 8.33 0 12.71 2.92 15 6.58 15zm-.31-5c-.73 0-1.36-.52-1.36-1.67 0-1.45.94-3.22 2.41-3.22.52 0 .84.2 1.25.83l-.52 3.02c-.63.73-1.25 1.05-1.78 1.05V10z\"/>"},"beaker":{"name":"beaker","figma":{"id":"0:26","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["experiment","labs","experimental","feature","test","science","education","study","development","testing"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14.38 14.59L11 7V3h1V2H3v1h1v4L.63 14.59A1 1 0 0 0 1.54 16h11.94c.72 0 1.2-.75.91-1.41h-.01zM3.75 10L5 7V3h5v4l1.25 3h-7.5zM8 8h1v1H8V8zM7 7H6V6h1v1zm0-3h1v1H7V4zm0-3H6V0h1v1z\"/>"},"bell":{"name":"bell","figma":{"id":"0:34","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["notification"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 12v1H0v-1l.73-.58c.77-.77.81-2.55 1.19-4.42C2.69 3.23 6 2 6 2c0-.55.45-1 1-1s1 .45 1 1c0 0 3.39 1.23 4.16 5 .38 1.88.42 3.66 1.19 4.42l.66.58H14zm-7 4c1.11 0 2-.89 2-2H5c0 1.11.89 2 2 2z\"/>"},"briefcase":{"name":"briefcase","figma":{"id":"0:58","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["suitcase","business"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 4V3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v1H1c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H9zM6 3h2v1H6V3zm7 6H8v1H6V9H1V5h1v3h10V5h1v4z\"/>"},"credit-card":{"name":"credit-card","figma":{"id":"0:173","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["money","billing","payments","transactions"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 9H2V8h10v1zm4-6v9c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h14c.55 0 1 .45 1 1zm-1 3H1v6h14V6zm0-3H1v1h14V3zm-9 7H2v1h4v-1z\"/>"},"device-camera-video":{"name":"device-camera-video","figma":{"id":"0:198","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["watch","view","media","stream"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15.2 2.09L10 5.72V3c0-.55-.45-1-1-1H1c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V9.28l5.2 3.63c.33.23.8 0 .8-.41v-10c0-.41-.47-.64-.8-.41z\"/>"},"device-camera":{"name":"device-camera","figma":{"id":"0:202","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["photo","picture","image","snapshot"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15 3H7c0-.55-.45-1-1-1H2c-.55 0-1 .45-1 1-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h14c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM6 5H2V4h4v1zm4.5 7C8.56 12 7 10.44 7 8.5S8.56 5 10.5 5 14 6.56 14 8.5 12.44 12 10.5 12zM13 8.5c0 1.38-1.13 2.5-2.5 2.5S8 9.87 8 8.5 9.13 6 10.5 6 13 7.13 13 8.5z\"/>"},"device-desktop":{"name":"device-desktop","figma":{"id":"0:208","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["computer","monitor"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15 2H1c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h5.34c-.25.61-.86 1.39-2.34 2h8c-1.48-.61-2.09-1.39-2.34-2H15c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm0 9H1V3h14v8z\"/>"},"device-mobile":{"name":"device-mobile","figma":{"id":"0:212","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["phone","iphone","cellphone"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 0H1C.45 0 0 .45 0 1v14c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1zM5 15.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zM9 12H1V2h8v10z\"/>"},"gift":{"name":"gift","figma":{"id":"0:338","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["package","present","skill","craft","freebie"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 4h-1.38c.19-.33.33-.67.36-.91.06-.67-.11-1.22-.52-1.61C11.1 1.1 10.65 1 10.1 1h-.11c-.53.02-1.11.25-1.53.58-.42.33-.73.72-.97 1.2-.23-.48-.55-.88-.97-1.2-.42-.32-1-.58-1.53-.58h-.03c-.56 0-1.06.09-1.44.48-.41.39-.58.94-.52 1.61.03.23.17.58.36.91H1.98c-.55 0-1 .45-1 1v3h1v5c0 .55.45 1 1 1h9c.55 0 1-.45 1-1V8h1V5c0-.55-.45-1-1-1H13zm-4.78-.88c.17-.36.42-.67.75-.92.3-.23.72-.39 1.05-.41h.09c.45 0 .66.11.8.25s.33.39.3.95c-.05.19-.25.61-.5 1h-2.9l.41-.88v.01zM4.09 2.04c.13-.13.31-.25.91-.25.31 0 .72.17 1.03.41.33.25.58.55.75.92L7.2 4H4.3c-.25-.39-.45-.81-.5-1-.03-.56.16-.81.3-.95l-.01-.01zM7 12.99H3V8h4v5-.01zm0-6H2V5h5v2-.01zm5 6H8V8h4v5-.01zm1-6H8V5h5v2-.01z\"/>"},"gear":{"name":"gear","figma":{"id":"0:334","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["settings"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z\"/>"},"book":{"name":"book","figma":{"id":"0:43","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","wiki","readme"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M3 5h4v1H3V5zm0 3h4V7H3v1zm0 2h4V9H3v1zm11-5h-4v1h4V5zm0 2h-4v1h4V7zm0 2h-4v1h4V9zm2-6v9c0 .55-.45 1-1 1H9.5l-1 1-1-1H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h5.5l1 1 1-1H15c.55 0 1 .45 1 1zm-8 .5L7.5 3H2v9h6V3.5zm7-.5H9.5l-.5.5V12h6V3z\"/>"},"tag":{"name":"tag","figma":{"id":"0:795","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["release"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7.73 1.73C7.26 1.26 6.62 1 5.96 1H3.5C2.13 1 1 2.13 1 3.5v2.47c0 .66.27 1.3.73 1.77l6.06 6.06c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41L7.73 1.73zM2.38 7.09c-.31-.3-.47-.7-.47-1.13V3.5c0-.88.72-1.59 1.59-1.59h2.47c.42 0 .83.16 1.13.47l6.14 6.13-4.73 4.73-6.13-6.15zM3.01 3h2v2H3V3h.01z\"/>"},"telescope":{"name":"telescope","figma":{"id":"0:806","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["science","space","look","view","explore"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 9l3 6h-1l-2-4v5H7v-6l-2 5H4l2-5 2-1zM7 0H6v1h1V0zM5 3H4v1h1V3zM2 1H1v1h1V1zM.63 9a.52.52 0 0 0-.16.67l.55.92c.13.23.41.31.64.2l1.39-.66-1.16-2-1.27.86.01.01zm7.89-5.39l-5.8 3.95L3.95 9.7l6.33-3.03-1.77-3.06h.01zm4.22 1.28l-1.47-2.52a.51.51 0 0 0-.72-.17l-1.2.83 1.84 3.2 1.33-.64c.27-.13.36-.44.22-.7z\"/>"},"tools":{"name":"tools","figma":{"id":"0:839","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["screwdriver","wrench","settings"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4.48 7.27c.26.26 1.28 1.33 1.28 1.33l.56-.58-.88-.91 1.69-1.8s-.76-.74-.43-.45c.32-1.19.03-2.51-.87-3.44C4.93.5 3.66.2 2.52.51l1.93 2-.51 1.96-1.89.52-1.93-2C-.19 4.17.1 5.48 1 6.4c.94.98 2.29 1.26 3.48.87zm6.44 1.94l-2.33 2.3 3.84 3.98c.31.33.73.49 1.14.49.41 0 .82-.16 1.14-.49.63-.65.63-1.7 0-2.35l-3.79-3.93zM16 2.53L13.55 0 6.33 7.46l.88.91-4.31 4.46-.99.53-1.39 2.27.35.37 2.2-1.44.51-1.02L7.9 9.08l.88.91L16 2.53z\"/>"},"trashcan":{"name":"trashcan","figma":{"id":"0:844","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["garbage","rubbish","recycle","delete"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11 2H9c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1H2c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1v9c0 .55.45 1 1 1h7c.55 0 1-.45 1-1V5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 12H3V5h1v8h1V5h1v8h1V5h1v8h1V5h1v9zm1-10H2V3h9v1z\"/>"},"unmute":{"name":"unmute","figma":{"id":"0:862","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["loud","volume","audio","sound","play"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 8.02c0 1.09-.45 2.09-1.17 2.83l-.67-.67c.55-.56.89-1.31.89-2.16 0-.85-.34-1.61-.89-2.16l.67-.67A3.99 3.99 0 0 1 12 8.02zM7.72 2.28L4 6H2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h2l3.72 3.72c.47.47 1.28.14 1.28-.53V2.81c0-.67-.81-1-1.28-.53zm5.94.08l-.67.67a6.996 6.996 0 0 1 2.06 4.98c0 1.94-.78 3.7-2.06 4.98l.67.67A7.973 7.973 0 0 0 16 8c0-2.22-.89-4.22-2.34-5.66v.02zm-1.41 1.41l-.69.67a5.05 5.05 0 0 1 1.48 3.58c0 1.39-.56 2.66-1.48 3.56l.69.67A5.971 5.971 0 0 0 14 8.02c0-1.65-.67-3.16-1.75-4.25z\"/>"},"watch":{"name":"watch","figma":{"id":"0:929","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["wait","hourglass","time","date"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 8h2v1H5V5h1v3zm6 0c0 2.22-1.2 4.16-3 5.19V15c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-1.81C1.2 12.16 0 10.22 0 8s1.2-4.16 3-5.19V1c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v1.81c1.8 1.03 3 2.97 3 5.19zm-1 0c0-2.77-2.23-5-5-5S1 5.23 1 8s2.23 5 5 5 5-2.23 5-5z\"/>"},"key":{"name":"key","figma":{"id":"0:938","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["key","lock","secure","safe"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12.83 2.17C12.08 1.42 11.14 1.03 10 1c-1.13.03-2.08.42-2.83 1.17S6.04 3.86 6.01 5c0 .3.03.59.09.89L0 12v1l1 1h2l1-1v-1h1v-1h1v-1h2l1.09-1.11c.3.08.59.11.91.11 1.14-.03 2.08-.42 2.83-1.17S13.97 6.14 14 5c-.03-1.14-.42-2.08-1.17-2.83zM11 5.38c-.77 0-1.38-.61-1.38-1.38 0-.77.61-1.38 1.38-1.38.77 0 1.38.61 1.38 1.38 0 .77-.61 1.38-1.38 1.38z\"/>"},"archive":{"name":"archive","figma":{"id":"2228:2","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["box","catalog"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 2H1v2h12V2zM0 4a1 1 0 0 0 1 1v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1v2zm2 1h10v9H2V5zm2 3h6V7H4v1z\"/>"},"light-bulb":{"name":"light-bulb","figma":{"id":"0:951","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["idea"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z\"/>"},"link":{"name":"link","figma":{"id":"0:496","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["connect","hyperlink"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z\"/>"},"location":{"name":"location","figma":{"id":"0:516","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["here","marker"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 0C2.69 0 0 2.5 0 5.5 0 10.02 6 16 6 16s6-5.98 6-10.5C12 2.5 9.31 0 6 0zm0 14.55C4.14 12.52 1 8.44 1 5.5 1 3.02 3.25 1 6 1c1.34 0 2.61.48 3.56 1.36.92.86 1.44 1.97 1.44 3.14 0 2.94-3.14 7.02-5 9.05zM8 5.5c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z\"/>"},"lock":{"name":"lock","figma":{"id":"0:521","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["secure","safe","protected"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 13H3v-1h1v1zm8-6v7c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h1V4c0-2.2 1.8-4 4-4s4 1.8 4 4v2h1c.55 0 1 .45 1 1zM3.8 6h4.41V4c0-1.22-.98-2.2-2.2-2.2-1.22 0-2.2.98-2.2 2.2v2H3.8zM11 7H2v7h9V7zM4 8H3v1h1V8zm0 2H3v1h1v-1z\"/>"},"mail-read":{"name":"mail-read","figma":{"id":"0:547","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["email","open"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 5H4V4h2v1zm3 1H4v1h5V6zm5-.48V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V5.52c0-.33.16-.63.42-.81L2 3.58V3c0-.55.45-1 1-1h1.2L7 0l2.8 2H11c.55 0 1 .45 1 1v.58l1.58 1.13c.27.19.42.48.42.81zM3 7.5L7 10l4-2.5V3H3v4.5zm-2 6l4.5-3-4.5-3v6zm11 .5l-5-3-5 3h10zm1-6.5l-4.5 3 4.5 3v-6z\"/>"},"mail":{"name":"mail","figma":{"id":"0:558","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["email","unread"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 4v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H1c-.55 0-1 .45-1 1zm13 0L7 9 1 4h12zM1 5.5l4 3-4 3v-6zM2 12l3.5-3L7 10.5 8.5 9l3.5 3H2zm11-.5l-4-3 4-3v6z\"/>"},"megaphone":{"name":"megaphone","figma":{"id":"0:572","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["bullhorn","loud","shout","broadcast"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 1c-.17 0-.36.05-.52.14C8.04 2.02 4.5 4.58 3 5c-1.38 0-3 .67-3 2.5S1.63 10 3 10c.3.08.64.23 1 .41V15h2v-3.45c1.34.86 2.69 1.83 3.48 2.31.16.09.34.14.52.14.52 0 1-.42 1-1V2c0-.58-.48-1-1-1zm0 12c-.38-.23-.89-.58-1.5-1-.16-.11-.33-.22-.5-.34V3.31c.16-.11.31-.2.47-.31.61-.41 1.16-.77 1.53-1v11zm2-6h4v1h-4V7zm0 2l4 2v1l-4-2V9zm4-6v1l-4 2V5l4-2z\"/>"},"bookmark":{"name":"bookmark","figma":{"id":"0:54","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["tab","star"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 0H1C.27 0 0 .27 0 1v15l5-3.09L10 16V1c0-.73-.27-1-1-1zm-.78 4.25L6.36 5.61l.72 2.16c.06.22-.02.28-.2.17L5 6.6 3.12 7.94c-.19.11-.25.05-.2-.17l.72-2.16-1.86-1.36c-.17-.16-.14-.23.09-.23l2.3-.03.7-2.16h.25l.7 2.16 2.3.03c.23 0 .27.08.09.23h.01z\"/>"},"calendar":{"name":"calendar","figma":{"id":"0:82","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["time","day","month","year","date","appointment"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 2h-1v1.5c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5V2H6v1.5c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5V2H2c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h11c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm0 12H2V5h11v9zM5 3H4V1h1v2zm6 0h-1V1h1v2zM6 7H5V6h1v1zm2 0H7V6h1v1zm2 0H9V6h1v1zm2 0h-1V6h1v1zM4 9H3V8h1v1zm2 0H5V8h1v1zm2 0H7V8h1v1zm2 0H9V8h1v1zm2 0h-1V8h1v1zm-8 2H3v-1h1v1zm2 0H5v-1h1v1zm2 0H7v-1h1v1zm2 0H9v-1h1v1zm2 0h-1v-1h1v1zm-8 2H3v-1h1v1zm2 0H5v-1h1v1zm2 0H7v-1h1v1zm2 0H9v-1h1v1z\"/>"},"clippy":{"name":"clippy","figma":{"id":"0:138","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["copy","paste","save","capture","clipboard"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z\"/>"},"clock":{"name":"clock","figma":{"id":"0:147","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["time","hour","minute","second","watch"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 8h3v2H7c-.55 0-1-.45-1-1V4h2v4zM7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z\"/>"},"desktop-download":{"name":"desktop-download","figma":{"id":"0:196","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["clone","download"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 6h3V0h2v6h3l-4 4-4-4zm11-4h-4v1h4v8H1V3h4V2H1c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h5.34c-.25.61-.86 1.39-2.34 2h8c-1.48-.61-2.09-1.39-2.34-2H15c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z\"/>"},"globe":{"name":"globe","figma":{"id":"0:389","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["world","earth","planet"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 1C3.14 1 0 4.14 0 8s3.14 7 7 7c.48 0 .94-.05 1.38-.14-.17-.08-.2-.73-.02-1.09.19-.41.81-1.45.2-1.8-.61-.35-.44-.5-.81-.91-.37-.41-.22-.47-.25-.58-.08-.34.36-.89.39-.94.02-.06.02-.27 0-.33 0-.08-.27-.22-.34-.23-.06 0-.11.11-.2.13-.09.02-.5-.25-.59-.33-.09-.08-.14-.23-.27-.34-.13-.13-.14-.03-.33-.11s-.8-.31-1.28-.48c-.48-.19-.52-.47-.52-.66-.02-.2-.3-.47-.42-.67-.14-.2-.16-.47-.2-.41-.04.06.25.78.2.81-.05.02-.16-.2-.3-.38-.14-.19.14-.09-.3-.95s.14-1.3.17-1.75c.03-.45.38.17.19-.13-.19-.3 0-.89-.14-1.11-.13-.22-.88.25-.88.25.02-.22.69-.58 1.16-.92.47-.34.78-.06 1.16.05.39.13.41.09.28-.05-.13-.13.06-.17.36-.13.28.05.38.41.83.36.47-.03.05.09.11.22s-.06.11-.38.3c-.3.2.02.22.55.61s.38-.25.31-.55c-.07-.3.39-.06.39-.06.33.22.27.02.5.08.23.06.91.64.91.64-.83.44-.31.48-.17.59.14.11-.28.3-.28.3-.17-.17-.19.02-.3.08-.11.06-.02.22-.02.22-.56.09-.44.69-.42.83 0 .14-.38.36-.47.58-.09.2.25.64.06.66-.19.03-.34-.66-1.31-.41-.3.08-.94.41-.59 1.08.36.69.92-.19 1.11-.09.19.1-.06.53-.02.55.04.02.53.02.56.61.03.59.77.53.92.55.17 0 .7-.44.77-.45.06-.03.38-.28 1.03.09.66.36.98.31 1.2.47.22.16.08.47.28.58.2.11 1.06-.03 1.28.31.22.34-.88 2.09-1.22 2.28-.34.19-.48.64-.84.92s-.81.64-1.27.91c-.41.23-.47.66-.66.8 3.14-.7 5.48-3.5 5.48-6.84 0-3.86-3.14-7-7-7L7 1zm1.64 6.56c-.09.03-.28.22-.78-.08-.48-.3-.81-.23-.86-.28 0 0-.05-.11.17-.14.44-.05.98.41 1.11.41.13 0 .19-.13.41-.05.22.08.05.13-.05.14zM6.34 1.7c-.05-.03.03-.08.09-.14.03-.03.02-.11.05-.14.11-.11.61-.25.52.03-.11.27-.58.3-.66.25zm1.23.89c-.19-.02-.58-.05-.52-.14.3-.28-.09-.38-.34-.38-.25-.02-.34-.16-.22-.19.12-.03.61.02.7.08.08.06.52.25.55.38.02.13 0 .25-.17.25zm1.47-.05c-.14.09-.83-.41-.95-.52-.56-.48-.89-.31-1-.41-.11-.1-.08-.19.11-.34.19-.15.69.06 1 .09.3.03.66.27.66.55.02.25.33.5.19.63h-.01z\"/>"},"home":{"name":"home","figma":{"id":"0:408","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["welcome","index","house","building"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16 9l-3-3V2h-2v2L8 1 0 9h2l1 5c0 .55.45 1 1 1h8c.55 0 1-.45 1-1l1-5h2zm-4 5H9v-4H7v4H4L2.81 7.69 8 2.5l5.19 5.19L12 14z\"/>"},"inbox":{"name":"inbox","figma":{"id":"0:426","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["mail","todo","new","messages"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 9l-1.13-7.14c-.08-.48-.5-.86-1-.86H2.13c-.5 0-.92.38-1 .86L0 9v5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9zm-3.28.55l-.44.89c-.17.34-.52.56-.91.56H4.61c-.38 0-.72-.22-.89-.55l-.44-.91c-.17-.33-.52-.55-.89-.55H1l1-7h10l1 7h-1.38c-.39 0-.73.22-.91.55l.01.01z\"/>"},"law":{"name":"law","figma":{"id":"0:490","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["legal","bill"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 4c-.83 0-1.5-.67-1.5-1.5S6.17 1 7 1s1.5.67 1.5 1.5S7.83 4 7 4zm7 6c0 1.11-.89 2-2 2h-1c-1.11 0-2-.89-2-2l2-4h-1c-.55 0-1-.45-1-1H8v8c.42 0 1 .45 1 1h1c.42 0 1 .45 1 1H3c0-.55.58-1 1-1h1c0-.55.58-1 1-1h.03L6 5H5c0 .55-.45 1-1 1H3l2 4c0 1.11-.89 2-2 2H2c-1.11 0-2-.89-2-2l2-4H1V5h3c0-.55.45-1 1-1h4c.55 0 1 .45 1 1h3v1h-1l2 4zM2.5 7L1 10h3L2.5 7zM13 10l-1.5-3-1.5 3h3z\"/>"},"milestone":{"name":"milestone","figma":{"id":"0:583","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["marker"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 2H6V0h2v2zm4 5H2c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h10l2 2-2 2zM8 4H6v2h2V4zM6 16h2V8H6v8z\"/>"},"mortar-board":{"name":"mortar-board","figma":{"id":"0:594","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["education","learn","teach"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.11 2.8a.34.34 0 0 0-.2 0L.27 5.18a.35.35 0 0 0 0 .67L2 6.4v1.77c-.3.17-.5.5-.5.86 0 .19.05.36.14.5-.08.14-.14.31-.14.5v2.58c0 .55 2 .55 2 0v-2.58c0-.19-.05-.36-.14-.5.08-.14.14-.31.14-.5 0-.38-.2-.69-.5-.86V6.72l4.89 1.53c.06.02.14.02.2 0l7.64-2.38a.35.35 0 0 0 0-.67L8.1 2.81l.01-.01zM4 8l3.83 1.19h-.02c.13.03.25.03.36 0L12 8v2.5c0 1-1.8 1.5-4 1.5s-4-.5-4-1.5V8zm3.02-2.5c0 .28.45.5 1 .5s1-.22 1-.5-.45-.5-1-.5-1 .22-1 .5z\"/>"},"package":{"name":"package","figma":{"id":"0:617","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["box","ship"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M1 4.27v7.47c0 .45.3.84.75.97l6.5 1.73c.16.05.34.05.5 0l6.5-1.73c.45-.13.75-.52.75-.97V4.27c0-.45-.3-.84-.75-.97l-6.5-1.74a1.4 1.4 0 0 0-.5 0L1.75 3.3c-.45.13-.75.52-.75.97zm7 9.09l-6-1.59V5l6 1.61v6.75zM2 4l2.5-.67L11 5.06l-2.5.67L2 4zm13 7.77l-6 1.59V6.61l2-.55V8.5l2-.53V5.53L15 5v6.77zm-2-7.24L6.5 2.8l2-.53L15 4l-2 .53z\"/>"},"pencil":{"name":"pencil","figma":{"id":"0:630","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["edit","change","update","write"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M0 12v3h3l8-8-3-3-8 8zm3 2H1v-2h1v1h1v1zm10.3-9.3L12 6 9 3l1.3-1.3a.996.996 0 0 1 1.41 0l1.59 1.59c.39.39.39 1.02 0 1.41z\"/>"},"pin":{"name":"pin","figma":{"id":"0:635","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["save","star","bookmark"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 1.2V2l.5 1L6 6H2.2c-.44 0-.67.53-.34.86L5 10l-4 5 5-4 3.14 3.14a.5.5 0 0 0 .86-.34V10l3-4.5 1 .5h.8c.44 0 .67-.53.34-.86L10.86.86a.5.5 0 0 0-.86.34z\"/>"},"plug":{"name":"plug","figma":{"id":"0:637","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["hook","webhook"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 6V5h-4V3H8v1H6c-1.03 0-1.77.81-2 2L3 7c-1.66 0-3 1.34-3 3v2h1v-2c0-1.11.89-2 2-2l1 1c.25 1.16.98 2 2 2h2v1h2v-2h4V9h-4V6h4z\"/>"},"rocket":{"name":"rocket","figma":{"id":"0:715","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["staff","stafftools","blast","off","space","launch","ship"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12.17 3.83c-.27-.27-.47-.55-.63-.88-.16-.31-.27-.66-.34-1.02-.58.33-1.16.7-1.73 1.13-.58.44-1.14.94-1.69 1.48-.7.7-1.33 1.81-1.78 2.45H3L0 10h3l2-2c-.34.77-1.02 2.98-1 3l1 1c.02.02 2.23-.64 3-1l-2 2v3l3-3v-3c.64-.45 1.75-1.09 2.45-1.78.55-.55 1.05-1.13 1.47-1.7.44-.58.81-1.16 1.14-1.72-.36-.08-.7-.19-1.03-.34a3.39 3.39 0 0 1-.86-.63zM16 0s-.09.38-.3 1.06c-.2.7-.55 1.58-1.06 2.66-.7-.08-1.27-.33-1.66-.72-.39-.39-.63-.94-.7-1.64C13.36.84 14.23.48 14.92.28 15.62.08 16 0 16 0z\"/>"},"search":{"name":"search","figma":{"id":"0:729","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["magnifying","glass"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.41v.01zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z\"/>"},"note":{"name":"note","figma":{"id":"0:891","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["card","paper","ticket"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M3 10h4V9H3v1zm0-2h6V7H3v1zm0-2h8V5H3v1zm10 6H1V3h12v9zM1 2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1H1z\"/>"},"shield":{"name":"shield","figma":{"id":"0:762","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["protect","shield","lock"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 0L0 2v6.02C0 12.69 5.31 16 7 16c1.69 0 7-3.31 7-7.98V2L7 0zM5 11l1.14-2.8a.568.568 0 0 0-.25-.59C5.33 7.25 5 6.66 5 6c0-1.09.89-2 1.98-2C8.06 4 9 4.91 9 6c0 .66-.33 1.25-.89 1.61-.19.13-.3.36-.25.59L9 11H5z\"/>"},"dashboard":{"name":"dashboard","figma":{"id":"0:182","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["speed","dial"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 5H8V4h1v1zm4 3h-1v1h1V8zM6 5H5v1h1V5zM5 8H4v1h1V8zm11-5.5l-.5-.5L9 7c-.06-.02-1 0-1 0-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-.92l6-5.58zm-1.59 4.09c.19.61.3 1.25.3 1.91 0 3.42-2.78 6.2-6.2 6.2-3.42 0-6.21-2.78-6.21-6.2 0-3.42 2.78-6.2 6.2-6.2 1.2 0 2.31.34 3.27.94l.94-.94A7.459 7.459 0 0 0 8.51 1C4.36 1 1 4.36 1 8.5 1 12.64 4.36 16 8.5 16c4.14 0 7.5-3.36 7.5-7.5 0-1.03-.2-2.02-.59-2.91l-1 1z\"/>"},"graph":{"name":"graph","figma":{"id":"0:396","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["trend","stats","statistics"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16 14v1H0V0h1v14h15zM5 13H3V8h2v5zm4 0H7V3h2v10zm4 0h-2V6h2v7z\"/>"},"settings":{"name":"settings","figma":{"id":"0:751","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["sliders","filters","controls","levels"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 7H3V2h1v5zm-1 7h1v-3H3v3zm5 0h1V8H8v6zm5 0h1v-2h-1v2zm1-12h-1v6h1V2zM9 2H8v2h1V2zM5 8H2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1zm5-3H7c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1zm5 4h-3c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1z\"/>"},"project":{"name":"project","figma":{"id":"0:868","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["board","kanban","columns","scrum"],"width":15,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 12h3V2h-3v10zm-4-2h3V2H6v8zm-4 4h3V2H2v12zm-1 1h13V1H1v14zM14 0H1a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1z\"/>"},"play":{"name":"play","figma":{"id":"8346:0","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["play","start","begin","action"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 8A7 7 0 1 1 0 8a7 7 0 0 1 14 0zm-8.223 3.482l4.599-3.066a.5.5 0 0 0 0-.832L5.777 4.518A.5.5 0 0 0 5 4.934v6.132a.5.5 0 0 0 .777.416z\"/>"},"github-action":{"name":"github-action","figma":{"id":"8346:4","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["board","workflow","action","automation"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 2h6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H9a1 1 0 1 1-2 0H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h6a1 1 0 1 1 2 0zm6 1v10H1V3h14zm-2.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z\"/>"},"code":{"name":"code","figma":{"id":"0:160","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["brackets"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9.5 3L8 4.5 11.5 8 8 11.5 9.5 13 14 8 9.5 3zm-5 0L0 8l4.5 5L6 11.5 2.5 8 6 4.5 4.5 3z\"/>"},"git-branch":{"name":"git-branch","figma":{"id":"0:360","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["fork","branch","git","duplicate"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 5c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v.3c-.02.52-.23.98-.63 1.38-.4.4-.86.61-1.38.63-.83.02-1.48.16-2 .45V4.72a1.993 1.993 0 0 0-1-3.72C.88 1 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2 1.11 0 2-.89 2-2 0-.53-.2-1-.53-1.36.09-.06.48-.41.59-.47.25-.11.56-.17.94-.17 1.05-.05 1.95-.45 2.75-1.25S8.95 7.77 9 6.73h-.02C9.59 6.37 10 5.73 10 5zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm0 12.41c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm6-8c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"/>"},"diff-added":{"name":"diff-added","figma":{"id":"0:217","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["new","addition","plus"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z\"/>"},"diff-ignored":{"name":"diff-ignored","figma":{"id":"0:222","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["slash"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zm-8.5-2H3v-1.5L9.5 4H11v1.5L4.5 12z\"/>"},"diff-modified":{"name":"diff-modified","figma":{"id":"0:227","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["dot","changed","updated"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM4 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z\"/>"},"diff-removed":{"name":"diff-removed","figma":{"id":"0:232","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["deleted","subtracted","dash"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zm-2-5H3V7h8v2z\"/>"},"diff-renamed":{"name":"diff-renamed","figma":{"id":"0:237","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["moved","arrow"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 9H3V7h3V4l5 4-5 4V9zm8-7v12c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-1 0H1v12h12V2z\"/>"},"diff":{"name":"diff","figma":{"id":"0:242","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["difference","changes","compare"],"width":13,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 7h2v1H6v2H5V8H3V7h2V5h1v2zm-3 6h5v-1H3v1zM7.5 2L11 5.5V15c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h6.5zM10 6L7 3H1v12h9V6zM8.5 0H3v1h5l4 4v8h1V4.5L8.5 0z\"/>"},"circuit-board":{"name":"circuit-board","figma":{"id":"0:132","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["developer","hardware","electricity"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M3 5c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm8 0c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1zm0 6c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1zm2-10H5v2.17c.36.19.64.47.83.83h2.34c.42-.78 1.33-1.28 2.34-1.05.75.19 1.36.8 1.53 1.55.31 1.38-.72 2.59-2.05 2.59-.8 0-1.48-.44-1.83-1.09H5.83c-.42.8-1.33 1.28-2.34 1.03-.73-.17-1.34-.78-1.52-1.52C1.72 4.49 2.2 3.59 3 3.17V1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1l5-5h2.17c.42-.78 1.33-1.28 2.34-1.05.75.19 1.36.8 1.53 1.55.31 1.38-.72 2.59-2.05 2.59-.8 0-1.48-.44-1.83-1.09H6.99L4 15h9c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1z\"/>"},"gist":{"name":"gist","figma":{"id":"0:354","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["gist","github"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7.5 5L10 7.5 7.5 10l-.75-.75L8.5 7.5 6.75 5.75 7.5 5zm-3 0L2 7.5 4.5 10l.75-.75L3.5 7.5l1.75-1.75L4.5 5zM0 13V2c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v11c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1zm1 0h10V2H1v11z\"/>"},"git-commit":{"name":"git-commit","figma":{"id":"0:366","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["save"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10.86 7c-.45-1.72-2-3-3.86-3-1.86 0-3.41 1.28-3.86 3H0v2h3.14c.45 1.72 2 3 3.86 3 1.86 0 3.41-1.28 3.86-3H14V7h-3.14zM7 10.2c-1.22 0-2.2-.98-2.2-2.2 0-1.22.98-2.2 2.2-2.2 1.22 0 2.2.98 2.2 2.2 0 1.22-.98 2.2-2.2 2.2z\"/>"},"git-compare":{"name":"git-compare","figma":{"id":"0:370","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["difference","changes"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M5 12H4c-.27-.02-.48-.11-.69-.31-.21-.2-.3-.42-.31-.69V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V11c.03.78.34 1.47.94 2.06.6.59 1.28.91 2.06.94h1v2l3-3-3-3v2zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm11 9.48V5c-.03-.78-.34-1.47-.94-2.06-.6-.59-1.28-.91-2.06-.94H9V0L6 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 12 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"/>"},"git-merge":{"name":"git-merge","figma":{"id":"0:376","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["join"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 7c-.73 0-1.38.41-1.73 1.02V8C7.22 7.98 6 7.64 5.14 6.98c-.75-.58-1.5-1.61-1.89-2.44A1.993 1.993 0 0 0 2 .99C.89.99 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2a1.993 1.993 0 0 0 1-3.72V7.67c.67.7 1.44 1.27 2.3 1.69.86.42 2.03.63 2.97.64v-.02c.36.61 1 1.02 1.73 1.02 1.11 0 2-.89 2-2 0-1.11-.89-2-2-2zm-6.8 6c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm8 6c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"/>"},"git-pull-request":{"name":"git-pull-request","figma":{"id":"0:382","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["review"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"/>"},"issue-closed":{"name":"issue-closed","figma":{"id":"0:436","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["done","complete"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 10h2v2H7v-2zm2-6H7v5h2V4zm1.5 1.5l-1 1L12 9l4-4.5-1-1L12 7l-1.5-1.5zM8 13.7A5.71 5.71 0 0 1 2.3 8c0-3.14 2.56-5.7 5.7-5.7 1.83 0 3.45.88 4.5 2.2l.92-.92A6.947 6.947 0 0 0 8 1C4.14 1 1 4.14 1 8s3.14 7 7 7 7-3.14 7-7l-1.52 1.52c-.66 2.41-2.86 4.19-5.48 4.19v-.01z\"/>"},"issue-opened":{"name":"issue-opened","figma":{"id":"0:442","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["new"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z\"/>"},"issue-reopened":{"name":"issue-reopened","figma":{"id":"0:448","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["regression"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 9H6V4h2v5zm-2 3h2v-2H6v2zm6.33-2H10l1.5 1.5c-1.05 1.33-2.67 2.2-4.5 2.2A5.71 5.71 0 0 1 1.3 8c0-.34.03-.67.09-1H.08C.03 7.33 0 7.66 0 8c0 3.86 3.14 7 7 7 2.19 0 4.13-1.02 5.41-2.59L14 14v-4h-1.67zM1.67 6H4L2.5 4.5C3.55 3.17 5.17 2.3 7 2.3c3.14 0 5.7 2.56 5.7 5.7 0 .34-.03.67-.09 1h1.31c.05-.33.08-.66.08-1 0-3.86-3.14-7-7-7-2.19 0-4.13 1.02-5.41 2.59L0 2v4h1.67z\"/>"},"database":{"name":"database","figma":{"id":"0:190","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["disks","data"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 15c-3.31 0-6-.9-6-2v-2c0-.17.09-.34.21-.5.67.86 3 1.5 5.79 1.5s5.12-.64 5.79-1.5c.13.16.21.33.21.5v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V7c0-.11.04-.21.09-.31.03-.06.07-.13.12-.19C.88 7.36 3.21 8 6 8s5.12-.64 5.79-1.5c.05.06.09.13.12.19.05.1.09.21.09.31v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V3c0-1.1 2.69-2 6-2s6 .9 6 2v2c0 1.1-2.69 2-6 2zm0-5c-2.21 0-4 .45-4 1s1.79 1 4 1 4-.45 4-1-1.79-1-4-1z\"/>"},"no-newline":{"name":"no-newline","figma":{"id":"0:603","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["return"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16 5v3c0 .55-.45 1-1 1h-3v2L9 8l3-3v2h2V5h2zM8 8c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4zM1.5 9.66L5.66 5.5C5.18 5.19 4.61 5 4 5 2.34 5 1 6.34 1 8c0 .61.19 1.17.5 1.66zM7 8c0-.61-.19-1.17-.5-1.66L2.34 10.5c.48.31 1.05.5 1.66.5 1.66 0 3-1.34 3-3z\"/>"},"broadcast":{"name":"broadcast","figma":{"id":"0:63","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["rss","radio","signal"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M9 9H8c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1H6c-.55 0-1 .45-1 1v2h1v3c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-3h1v-2c0-.55-.45-1-1-1zM7 7h1v1H7V7zm2 4H8v4H7v-4H6v-1h3v1zm2.09-3.5c0-1.98-1.61-3.59-3.59-3.59A3.593 3.593 0 0 0 4 8.31v1.98c-.61-.77-1-1.73-1-2.8 0-2.48 2.02-4.5 4.5-4.5S12 5.01 12 7.49c0 1.06-.39 2.03-1 2.8V8.31c.06-.27.09-.53.09-.81zm3.91 0c0 2.88-1.63 5.38-4 6.63v-1.05a6.553 6.553 0 0 0 3.09-5.58A6.59 6.59 0 0 0 7.5.91 6.59 6.59 0 0 0 .91 7.5c0 2.36 1.23 4.42 3.09 5.58v1.05A7.497 7.497 0 0 1 7.5 0C11.64 0 15 3.36 15 7.5z\"/>"},"keyboard":{"name":"keyboard","figma":{"id":"0:466","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["type","keys","write","shortcuts"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 5H9V4h1v1zM3 6H2v1h1V6zm5-2H7v1h1V4zM4 4H2v1h2V4zm8 7h2v-1h-2v1zM8 7h1V6H8v1zm-4 3H2v1h2v-1zm8-6h-1v1h1V4zm2 0h-1v1h1V4zm-2 5h2V6h-2v3zm4-6v9c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h14c.55 0 1 .45 1 1zm-1 0H1v9h14V3zM6 7h1V6H6v1zm0-3H5v1h1V4zM4 7h1V6H4v1zm1 4h6v-1H5v1zm5-4h1V6h-1v1zM3 8H2v1h1V8zm5 0v1h1V8H8zM6 8v1h1V8H6zM5 8H4v1h1V8zm5 1h1V8h-1v1z\"/>"},"file-binary":{"name":"file-binary","figma":{"id":"0:260","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["image","video","word","powerpoint","excel"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 12h1v1H2v-1h1v-2H2V9h2v3zm8-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5zM8 4H6v1h1v2H6v1h3V7H8V4zM2 4h3v4H2V4zm1 3h1V5H3v2zm3 2h3v4H6V9zm1 3h1v-2H7v2z\"/>"},"file-code":{"name":"file-code","figma":{"id":"0:270","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["text","javascript","html","css","php","ruby","coffeescript","sass","scss"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.5 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V4.5L8.5 1zM11 14H1V2h7l3 3v9zM5 6.98L3.5 8.5 5 10l-.5 1L2 8.5 4.5 6l.5.98zM7.5 6L10 8.5 7.5 11l-.5-.98L8.5 8.5 7 7l.5-1z\"/>"},"file-directory":{"name":"file-directory","figma":{"id":"0:276","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["folder"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z\"/>"},"file-media":{"name":"file-media","figma":{"id":"0:280","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["image","video","audio"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 5h2v2H6V5zm6-.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v11l3-5 2 4 2-2 3 3V5z\"/>"},"file-pdf":{"name":"file-pdf","figma":{"id":"0:285","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["adobe"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.5 1H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5L8.5 1zM1 2h4a.68.68 0 0 0-.31.2 1.08 1.08 0 0 0-.23.47 4.22 4.22 0 0 0-.09 1.47c.06.609.173 1.211.34 1.8A21.78 21.78 0 0 1 3.6 8.6c-.5 1-.8 1.66-.91 1.84a7.156 7.156 0 0 0-.69.3c-.362.165-.699.38-1 .64V2zm4.42 4.8a5.65 5.65 0 0 0 1.17 2.09c.275.237.595.417.94.53-.64.09-1.23.2-1.81.33-.618.15-1.223.347-1.81.59s.22-.44.61-1.25c.365-.74.67-1.51.91-2.3l-.01.01zM11 14H1.5a.743.743 0 0 1-.17 0 2.12 2.12 0 0 0 .73-.44 10.14 10.14 0 0 0 1.78-2.38c.31-.13.58-.23.81-.31l.42-.14c.45-.13.94-.23 1.44-.33s1-.16 1.48-.2c.447.216.912.394 1.39.53.403.11.814.188 1.23.23h.38V14H11zm0-4.86a3.743 3.743 0 0 0-.64-.28 4.221 4.221 0 0 0-.75-.11c-.411.003-.822.03-1.23.08a3 3 0 0 1-1-.64 6.07 6.07 0 0 1-1.29-2.33c.111-.661.178-1.33.2-2 .02-.25.02-.5 0-.75a1.05 1.05 0 0 0-.2-.88.82.82 0 0 0-.61-.23H8l3 3v4.14z\"/>"},"file-submodule":{"name":"file-submodule","figma":{"id":"0:292","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["folder"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 7H4v7h9c.55 0 1-.45 1-1V8h-4V7zM9 9H5V8h4v1zm4-5H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h2V7c0-.55.45-1 1-1h6c.55 0 1 .45 1 1h3V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z\"/>"},"file-symlink-directory":{"name":"file-symlink-directory","figma":{"id":"0:298","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["folder","subfolder","link","alias"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM1 3h5v1H1V3zm6 9v-2c-.98-.02-1.84.22-2.55.7-.71.48-1.19 1.25-1.45 2.3.02-1.64.39-2.88 1.13-3.73C4.86 8.43 5.82 8 7.01 8V6l4 3-4 3H7z\"/>"},"file-symlink-file":{"name":"file-symlink-file","figma":{"id":"0:303","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["link","alias"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.5 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V4.5L8.5 1zM11 14H1V2h7l3 3v9zM6 4.5l4 3-4 3v-2c-.98-.02-1.84.22-2.55.7-.71.48-1.19 1.25-1.45 2.3.02-1.64.39-2.88 1.13-3.73.73-.84 1.69-1.27 2.88-1.27v-2H6z\"/>"},"file-zip":{"name":"file-zip","figma":{"id":"0:316","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["compress","archive"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.5 1H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5L8.5 1zM11 14H1V2h3v1h1V2h3l3 3v9zM5 4V3h1v1H5zM4 4h1v1H4V4zm1 2V5h1v1H5zM4 6h1v1H4V6zm1 2V7h1v1H5zM4 9.28A2 2 0 0 0 3 11v1h4v-1a2 2 0 0 0-2-2V8H4v1.28zM6 10v1H4v-1h2z\"/>"},"browser":{"name":"browser","figma":{"id":"0:70","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["window","web"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M5 3h1v1H5V3zM3 3h1v1H3V3zM1 3h1v1H1V3zm12 10H1V5h12v8zm0-9H7V3h6v1zm1-1c0-.55-.45-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V3z\"/>"},"file":{"name":"file","figma":{"id":"0:308","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["file","text","words"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z\"/>"},"repo-clone":{"name":"repo-clone","figma":{"id":"0:669","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","repository"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15 0H9v7c0 .55.45 1 1 1h1v1h1V8h3c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1zm-4 7h-1V6h1v1zm4 0h-3V6h3v1zm0-2h-4V1h4v4zM4 5H3V4h1v1zm0-2H3V2h1v1zM2 1h6V0H1C.45 0 0 .45 0 1v12c0 .55.45 1 1 1h2v2l1.5-1.5L6 16v-2h5c.55 0 1-.45 1-1v-3H2V1zm9 10v2H6v-1H3v1H1v-2h10zM3 8h1v1H3V8zm1-1H3V6h1v1z\"/>"},"repo-force-push":{"name":"repo-force-push","figma":{"id":"0:681","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","put"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 9H8v7H6V9H4l2.25-3H4l3-4 3 4H7.75L10 9zm1-9H1C.45 0 0 .45 0 1v12c0 .55.45 1 1 1h4v-1H1v-2h4v-1H2V1h9v9H9v1h2v2H9v1h2c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1z\"/>"},"repo-forked":{"name":"repo-forked","figma":{"id":"0:685","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","copy"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"/>"},"repo-pull":{"name":"repo-pull","figma":{"id":"0:691","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","get"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 8V6H7V4h6V2l3 3-3 3zM4 2H3v1h1V2zm7 5h1v6c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v2h-1V1H2v9h9V7zm0 4H1v2h2v-1h3v1h5v-2zM4 6H3v1h1V6zm0-2H3v1h1V4zM3 9h1V8H3v1z\"/>"},"repo-push":{"name":"repo-push","figma":{"id":"0:700","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","repository","put"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 3H3V2h1v1zM3 5h1V4H3v1zm4 0L4 9h2v7h2V9h2L7 5zm4-5H1C.45 0 0 .45 0 1v12c0 .55.45 1 1 1h4v-1H1v-2h4v-1H2V1h9.02L11 10H9v1h2v2H9v1h2c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1z\"/>"},"repo":{"name":"repo","figma":{"id":"0:706","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["book","journal","repository"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z\"/>"},"mirror":{"name":"mirror","figma":{"id":"0:589","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["reflect"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M15.5 4.7L8.5 0l-7 4.7c-.3.19-.5.45-.5.8V16l7.5-4 7.5 4V5.5c0-.34-.2-.61-.5-.8zm-.5 9.8l-6-3.25V10H8v1.25L2 14.5v-9l6-4V6h1V1.5l6 4v9zM6 7h5V5l3 3-3 3V9H6v2L3 8l3-3v2z\"/>"},"ruby":{"name":"ruby","figma":{"id":"0:724","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["code","language"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 6l-5 5V4h3l2 2zm3 0l-8 8-8-8 4-4h8l4 4zm-8 6.5L14.5 6l-3-3h-7l-3 3L8 12.5z\"/>"},"server":{"name":"server","figma":{"id":"0:733","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["computers","racks","ops"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11 6H1c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1zM2 9H1V7h1v2zm2 0H3V7h1v2zm2 0H5V7h1v2zm2 0H7V7h1v2zm3-8H1c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zM2 4H1V2h1v2zm2 0H3V2h1v2zm2 0H5V2h1v2zm2 0H7V2h1v2zm3-1h-1V2h1v1zm0 8H1c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1zm-9 3H1v-2h1v2zm2 0H3v-2h1v2zm2 0H5v-2h1v2zm2 0H7v-2h1v2z\"/>"},"terminal":{"name":"terminal","figma":{"id":"0:815","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["code","ops","shell"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M7 10h4v1H7v-1zm-3 1l3-3-3-3-.75.75L5.5 8l-2.25 2.25L4 11zm10-8v10c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-1 0H1v10h12V3z\"/>"},"radio-tower":{"name":"radio-tower","figma":{"id":"0:659","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["broadcast"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4.79 6.11c.25-.25.25-.67 0-.92-.32-.33-.48-.76-.48-1.19 0-.43.16-.86.48-1.19.25-.26.25-.67 0-.92a.613.613 0 0 0-.45-.19c-.16 0-.33.06-.45.19-.57.58-.85 1.35-.85 2.11 0 .76.29 1.53.85 2.11.25.25.66.25.9 0zM2.33.52a.651.651 0 0 0-.92 0C.48 1.48.01 2.74.01 3.99c0 1.26.47 2.52 1.4 3.48.25.26.66.26.91 0s.25-.68 0-.94c-.68-.7-1.02-1.62-1.02-2.54 0-.92.34-1.84 1.02-2.54a.66.66 0 0 0 .01-.93zm5.69 5.1A1.62 1.62 0 1 0 6.4 4c-.01.89.72 1.62 1.62 1.62zM14.59.53a.628.628 0 0 0-.91 0c-.25.26-.25.68 0 .94.68.7 1.02 1.62 1.02 2.54 0 .92-.34 1.83-1.02 2.54-.25.26-.25.68 0 .94a.651.651 0 0 0 .92 0c.93-.96 1.4-2.22 1.4-3.48A5.048 5.048 0 0 0 14.59.53zM8.02 6.92c-.41 0-.83-.1-1.2-.3l-3.15 8.37h1.49l.86-1h4l.84 1h1.49L9.21 6.62c-.38.2-.78.3-1.19.3zm-.01.48L9.02 11h-2l.99-3.6zm-1.99 5.59l1-1h2l1 1h-4zm5.19-11.1c-.25.25-.25.67 0 .92.32.33.48.76.48 1.19 0 .43-.16.86-.48 1.19-.25.26-.25.67 0 .92a.63.63 0 0 0 .9 0c.57-.58.85-1.35.85-2.11 0-.76-.28-1.53-.85-2.11a.634.634 0 0 0-.9 0z\"/>"},"rss":{"name":"rss","figma":{"id":"0:719","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["broadcast","feed","atom"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M2 13H0v-2c1.11 0 2 .89 2 2zM0 3v1a9 9 0 0 1 9 9h1C10 7.48 5.52 3 0 3zm0 4v1c2.75 0 5 2.25 5 5h1c0-3.31-2.69-6-6-6z\"/>"},"versions":{"name":"versions","figma":{"id":"0:923","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["history","commits"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M13 3H7c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 8H8V5h4v6zM4 4h1v1H4v6h1v1H4c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1zM1 5h1v1H1v4h1v1H1c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1z\"/>"},"squirrel":{"name":"squirrel","figma":{"id":"0:779","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["ship","shipit","launch"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 1C9.79 1 8 2.31 8 3.92c0 1.94.5 3.03 0 6.08 0-4.5-2.77-6.34-4-6.34.05-.5-.48-.66-.48-.66s-.22.11-.3.34c-.27-.31-.56-.27-.56-.27l-.13.58S.7 4.29.68 6.87c.2.33 1.53.6 2.47.43.89.05.67.79.47.99C2.78 9.13 2 8 1 8S0 9 1 9s1 1 3 1c-3.09 1.2 0 4 0 4H3c-1 0-1 1-1 1h6c3 0 5-1 5-3.47 0-.85-.43-1.79-1-2.53-1.11-1.46.23-2.68 1-2 .77.68 3 1 3-2 0-2.21-1.79-4-4-4zM2.5 6c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5z\"/>"},"zap":{"name":"zap","figma":{"id":"0:934","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["electricity","lightning","props","like","star","save"],"width":10,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M10 7H6l3-7-9 9h4l-3 7 9-9z\"/>"},"flame":{"name":"flame","figma":{"id":"0:325","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["fire","hot","burn","trending"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z\"/>"},"bug":{"name":"bug","figma":{"id":"0:78","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["insect","issue"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M11 10h3V9h-3V8l3.17-1.03-.34-.94L11 7V6c0-.55-.45-1-1-1V4c0-.48-.36-.88-.83-.97L10.2 2H12V1H9.8l-2 2h-.59L5.2 1H3v1h1.8l1.03 1.03C5.36 3.12 5 3.51 5 4v1c-.55 0-1 .45-1 1v1l-2.83-.97-.34.94L4 8v1H1v1h3v1L.83 12.03l.34.94L4 12v1c0 .55.45 1 1 1h1l1-1V6h1v7l1 1h1c.55 0 1-.45 1-1v-1l2.83.97.34-.94L11 11v-1zM9 5H6V4h3v1z\"/>"},"person":{"name":"person","figma":{"id":"0:633","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["people","man","woman","human"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M12 14.002a.998.998 0 0 1-.998.998H1.001A1 1 0 0 1 0 13.999V13c0-2.633 4-4 4-4s.229-.409 0-1c-.841-.62-.944-1.59-1-4 .173-2.413 1.867-3 3-3s2.827.586 3 3c-.056 2.41-.159 3.38-1 4-.229.59 0 1 0 1s4 1.367 4 4v1.002z\"/>"},"smiley":{"name":"smiley","figma":{"id":"0:772","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["emoji","smile","mood","emotion"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm4.81 12.81a6.72 6.72 0 0 1-2.17 1.45c-.83.36-1.72.53-2.64.53-.92 0-1.81-.17-2.64-.53-.81-.34-1.55-.83-2.17-1.45a6.773 6.773 0 0 1-1.45-2.17A6.59 6.59 0 0 1 1.21 8c0-.92.17-1.81.53-2.64.34-.81.83-1.55 1.45-2.17.62-.62 1.36-1.11 2.17-1.45A6.59 6.59 0 0 1 8 1.21c.92 0 1.81.17 2.64.53.81.34 1.55.83 2.17 1.45.62.62 1.11 1.36 1.45 2.17.36.83.53 1.72.53 2.64 0 .92-.17 1.81-.53 2.64-.34.81-.83 1.55-1.45 2.17zM4 6.8v-.59c0-.66.53-1.19 1.2-1.19h.59c.66 0 1.19.53 1.19 1.19v.59c0 .67-.53 1.2-1.19 1.2H5.2C4.53 8 4 7.47 4 6.8zm5 0v-.59c0-.66.53-1.19 1.2-1.19h.59c.66 0 1.19.53 1.19 1.19v.59c0 .67-.53 1.2-1.19 1.2h-.59C9.53 8 9 7.47 9 6.8zm4 3.2c-.72 1.88-2.91 3-5 3s-4.28-1.13-5-3c-.14-.39.23-1 .66-1h8.59c.41 0 .89.61.75 1z\"/>"},"hubot":{"name":"hubot","figma":{"id":"0:419","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["robot","bot"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M3 6c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1H3zm8 1.75L9.75 9h-1.5L7 7.75 5.75 9h-1.5L3 7.75V7h.75L5 8.25 6.25 7h1.5L9 8.25 10.25 7H11v.75zM5 11h4v1H5v-1zm2-9C3.14 2 0 4.91 0 8.5V13c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V8.5C14 4.91 10.86 2 7 2zm6 11H1V8.5c0-3.09 2.64-5.59 6-5.59s6 2.5 6 5.59V13z\"/>"},"thumbsdown":{"name":"thumbsdown","figma":{"id":"0:831","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["thumb","thumbsdown","rejected","dislike"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16.968 8.314l-1.03-6.318C15.758.531 13.942 0 12.742 0h-6.7a1.08 1.08 0 0 0-.563.149l-1.529.913H2.124C.998 1.062 0 2.06 0 3.186v4.247c0 1.125.998 2.145 2.124 2.124h2.123c.967 0 1.476.477 2.538 1.645.966 1.062.935 1.912.67 3.473-.086.53.063 1.061.445 1.507.414.5 1.04.818 1.657.818 1.943 0 3.185-3.95 3.185-5.33l-.021-1.041h2.166c1.232 0 2.07-.85 2.102-2.092 0-.064.022-.138-.02-.212v-.01zm-2.092 1.264h-2.113c-.743 0-1.093.297-1.093 1.03l.03 1.092c0 1.349-1.242 4.248-2.123 4.248-.531 0-1.147-.531-1.062-1.062.265-1.678.361-2.952-.945-4.396-1.083-1.2-1.88-1.996-3.324-1.996v-6.37L6.02 1.062h6.721c.775 0 2.07.329 2.124 1.062l.02.02 1.063 6.372c-.032.68-.404 1.062-1.062 1.062h-.01z\"/>"},"thumbsup":{"name":"thumbsup","figma":{"id":"0:835","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["thumb","thumbsup","prop","ship","like"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14 14c-.05.69-1.27 1-2 1H5.67L4 14V8c1.36 0 2.11-.75 3.13-1.88 1.23-1.36 1.14-2.56.88-4.13-.08-.5.5-1 1-1 .83 0 2 2.73 2 4l-.02 1.03c0 .69.33.97 1.02.97h2c.63 0 .98.36 1 1l-1 6L14 14zm0-8h-2.02l.02-.98C12 3.72 10.83 0 9 0c-.58 0-1.17.3-1.56.77-.36.41-.5.91-.42 1.41.25 1.48.28 2.28-.63 3.28-1 1.09-1.48 1.55-2.39 1.55H2C.94 7 0 7.94 0 9v4c0 1.06.94 2 2 2h1.72l1.44.86c.16.09.33.14.52.14h6.33c1.13 0 2.84-.5 3-1.88l.98-5.95c.02-.08.02-.14.02-.2-.03-1.17-.84-1.97-2-1.97H14z\"/>"},"organization":{"name":"organization","figma":{"id":"0:613","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["people","group","team"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M16 12.999c0 .439-.45 1-1 1H7.995c-.539 0-.994-.447-.995-.999H1c-.54 0-1-.561-1-1 0-2.634 3-4 3-4s.229-.409 0-1c-.841-.621-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.442.58 2.5 3c.058 2.41-.159 2.379-1 3-.229.59 0 1 0 1s1.549.711 2.42 2.088C9.196 9.369 10 8.999 10 8.999s.229-.409 0-1c-.841-.62-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.437.581 2.495 3c.059 2.41-.158 2.38-1 3-.229.59 0 1 0 1s3.005 1.366 3.005 4z\"/>"},"gist-secret":{"name":"gist-secret","figma":{"id":"0:347","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["gist","secret","private"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 10.5L9 14H5l1-3.5L5.25 9h3.5L8 10.5zM10 6H4L2 7h10l-2-1zM9 2L7 3 5 2 4 5h6L9 2zm4.03 7.75L10 9l1 2-2 3h3.22c.45 0 .86-.31.97-.75l.56-2.28c.14-.53-.19-1.08-.72-1.22zM4 9l-3.03.75c-.53.14-.86.69-.72 1.22l.56 2.28c.11.44.52.75.97.75H5l-2-3 1-2z\"/>"},"eye":{"name":"eye","figma":{"id":"0:255","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["look","watch","see"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z\"/>"},"eye-closed":{"name":"eye-closed","figma":{"id":"10292:11","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["hidden","invisible","concealed",""],"width":16,"height":13.921463966369629,"path":"<path fill-rule=\"evenodd\" d=\"M14.822.854a.5.5 0 1 0-.707-.708l-2.11 2.11C10.89 1.483 9.565.926 8.06.926c-5.06 0-8.06 6-8.06 6s1.162 2.323 3.258 4.078l-2.064 2.065a.5.5 0 1 0 .707.707L14.822.854zM4.86 9.403L6.292 7.97A1.999 1.999 0 0 1 6 6.925c0-1.11.89-2 2-2 .384 0 .741.106 1.045.292l1.433-1.433A3.98 3.98 0 0 0 8 2.925c-2.2 0-4 1.8-4 4 0 .938.321 1.798.859 2.478zm7.005-3.514l1.993-1.992A14.873 14.873 0 0 1 16 6.925s-3 6-7.94 6a6.609 6.609 0 0 1-2.661-.57l1.565-1.566c.33.089.678.136 1.036.136 2.22 0 4-1.78 4-4 0-.358-.047-.705-.136-1.036zM9.338 8.415l.152-.151a1.996 1.996 0 0 1-.152.151z\"/>"},"jersey":{"name":"jersey","figma":{"id":"0:458","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["team","game","basketball"],"width":14,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4.5 6l-.5.5v5l.5.5h2l.5-.5v-5L6.5 6h-2zM6 11H5V7h1v4zm6.27-7.25C12.05 2.37 11.96 1.12 12 0H9.02c0 .27-.13.48-.39.69-.25.2-.63.3-1.13.3-.5 0-.88-.09-1.13-.3-.23-.2-.36-.42-.36-.69H3c.05 1.13-.03 2.38-.25 3.75C2.55 5.13 1.95 5.88 1 6v9c.02.27.11.48.31.69.2.21.42.3.69.31h11c.27-.02.48-.11.69-.31.21-.2.3-.42.31-.69V6c-.95-.13-1.53-.88-1.75-2.25h.02zM13 15H2V7c.89-.5 1.48-1.25 1.72-2.25S4.03 2.5 4 1h1c-.02.78.16 1.47.52 2.06.36.58 1.02.89 2 .94.98-.02 1.64-.33 2-.94.36-.59.5-1.28.48-2.06h1c.02 1.42.13 2.55.33 3.38.2.81.69 2 1.67 2.63v8V15zM8.5 6l-.5.5v5l.5.5h2l.5-.5v-5l-.5-.5h-2zm1.5 5H9V7h1v4z\"/>"},"octoface":{"name":"octoface","figma":{"id":"0:609","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["octocat","brand"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14.7 5.34c.13-.32.55-1.59-.13-3.31 0 0-1.05-.33-3.44 1.3-1-.28-2.07-.32-3.13-.32s-2.13.04-3.13.32c-2.39-1.64-3.44-1.3-3.44-1.3-.68 1.72-.26 2.99-.13 3.31C.49 6.21 0 7.33 0 8.69 0 13.84 3.33 15 7.98 15S16 13.84 16 8.69c0-1.36-.49-2.48-1.3-3.35zM8 14.02c-3.3 0-5.98-.15-5.98-3.35 0-.76.38-1.48 1.02-2.07 1.07-.98 2.9-.46 4.96-.46 2.07 0 3.88-.52 4.96.46.65.59 1.02 1.3 1.02 2.07 0 3.19-2.68 3.35-5.98 3.35zM5.49 9.01c-.66 0-1.2.8-1.2 1.78s.54 1.79 1.2 1.79c.66 0 1.2-.8 1.2-1.79s-.54-1.78-1.2-1.78zm5.02 0c-.66 0-1.2.79-1.2 1.78s.54 1.79 1.2 1.79c.66 0 1.2-.8 1.2-1.79s-.53-1.78-1.2-1.78z\"/>"},"mark-github":{"name":"mark-github","figma":{"id":"0:563","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["octocat","brand","github","logo"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z\"/>"},"logo-github":{"name":"logo-github","figma":{"id":"0:536","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["brand","github","logo"],"width":45,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M18.53 12.03h-.02c.009 0 .015.01.024.011h.006l-.01-.01zm.004.011c-.093.001-.327.05-.574.05-.78 0-1.05-.36-1.05-.83V8.13h1.59c.09 0 .16-.08.16-.19v-1.7c0-.09-.08-.17-.16-.17h-1.59V3.96c0-.08-.05-.13-.14-.13h-2.16c-.09 0-.14.05-.14.13v2.17s-1.09.27-1.16.28c-.08.02-.13.09-.13.17v1.36c0 .11.08.19.17.19h1.11v3.28c0 2.44 1.7 2.69 2.86 2.69.53 0 1.17-.17 1.27-.22.06-.02.09-.09.09-.16v-1.5a.177.177 0 0 0-.146-.18zM42.23 9.84c0-1.81-.73-2.05-1.5-1.97-.6.04-1.08.34-1.08.34v3.52s.49.34 1.22.36c1.03.03 1.36-.34 1.36-2.25zm2.43-.16c0 3.43-1.11 4.41-3.05 4.41-1.64 0-2.52-.83-2.52-.83s-.04.46-.09.52c-.03.06-.08.08-.14.08h-1.48c-.1 0-.19-.08-.19-.17l.02-11.11c0-.09.08-.17.17-.17h2.13c.09 0 .17.08.17.17v3.77s.82-.53 2.02-.53l-.01-.02c1.2 0 2.97.45 2.97 3.88zm-8.72-3.61h-2.1c-.11 0-.17.08-.17.19v5.44s-.55.39-1.3.39-.97-.34-.97-1.09V6.25c0-.09-.08-.17-.17-.17h-2.14c-.09 0-.17.08-.17.17v5.11c0 2.2 1.23 2.75 2.92 2.75 1.39 0 2.52-.77 2.52-.77s.05.39.08.45c.02.05.09.09.16.09h1.34c.11 0 .17-.08.17-.17l.02-7.47c0-.09-.08-.17-.19-.17zm-23.7-.01h-2.13c-.09 0-.17.09-.17.2v7.34c0 .2.13.27.3.27h1.92c.2 0 .25-.09.25-.27V6.23c0-.09-.08-.17-.17-.17zm-1.05-3.38c-.77 0-1.38.61-1.38 1.38 0 .77.61 1.38 1.38 1.38.75 0 1.36-.61 1.36-1.38 0-.77-.61-1.38-1.36-1.38zm16.49-.25h-2.11c-.09 0-.17.08-.17.17v4.09h-3.31V2.6c0-.09-.08-.17-.17-.17h-2.13c-.09 0-.17.08-.17.17v11.11c0 .09.09.17.17.17h2.13c.09 0 .17-.08.17-.17V8.96h3.31l-.02 4.75c0 .09.08.17.17.17h2.13c.09 0 .17-.08.17-.17V2.6c0-.09-.08-.17-.17-.17zM8.81 7.35v5.74c0 .04-.01.11-.06.13 0 0-1.25.89-3.31.89-2.49 0-5.44-.78-5.44-5.92S2.58 1.99 5.1 2c2.18 0 3.06.49 3.2.58.04.05.06.09.06.14L7.94 4.5c0 .09-.09.2-.2.17-.36-.11-.9-.33-2.17-.33-1.47 0-3.05.42-3.05 3.73s1.5 3.7 2.58 3.7c.92 0 1.25-.11 1.25-.11v-2.3H4.88c-.11 0-.19-.08-.19-.17V7.35c0-.09.08-.17.19-.17h3.74c.11 0 .19.08.19.17z\"/>"},"logo-gist":{"name":"logo-gist","figma":{"id":"0:529","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["brand","github","logo"],"width":25,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M4.7 8.73h2.45v4.02c-.55.27-1.64.34-2.53.34-2.56 0-3.47-2.2-3.47-5.05 0-2.85.91-5.06 3.48-5.06 1.28 0 2.06.23 3.28.73V2.66C7.27 2.33 6.25 2 4.63 2 1.13 2 0 4.69 0 8.03c0 3.34 1.11 6.03 4.63 6.03 1.64 0 2.81-.27 3.59-.64V7.73H4.7v1zm6.39 3.72V6.06h-1.05v6.28c0 1.25.58 1.72 1.72 1.72v-.89c-.48 0-.67-.16-.67-.7v-.02zm.25-8.72c0-.44-.33-.78-.78-.78s-.77.34-.77.78.33.78.77.78.78-.34.78-.78zm4.34 5.69c-1.5-.13-1.78-.48-1.78-1.17 0-.77.33-1.34 1.88-1.34 1.05 0 1.66.16 2.27.36v-.94c-.69-.3-1.52-.39-2.25-.39-2.2 0-2.92 1.2-2.92 2.31 0 1.08.47 1.88 2.73 2.08 1.55.13 1.77.63 1.77 1.34 0 .73-.44 1.42-2.06 1.42-1.11 0-1.86-.19-2.33-.36v.94c.5.2 1.58.39 2.33.39 2.38 0 3.14-1.2 3.14-2.41 0-1.28-.53-2.03-2.75-2.23h-.03zm8.58-2.47v-.86h-2.42v-2.5l-1.08.31v2.11l-1.56.44v.48h1.56v5c0 1.53 1.19 2.13 2.5 2.13.19 0 .52-.02.69-.05v-.89c-.19.03-.41.03-.61.03-.97 0-1.5-.39-1.5-1.34V6.94h2.42v.02-.01z\"/>"},"markdown":{"name":"markdown","figma":{"id":"0:567","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["markup","style"],"width":16,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.64 0 1.15-.52 1.15-1.15v-7.7C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.5L9.5 8H11V5h2v3h1.5l-2.51 3.5z\"/>"},"paintcan":{"name":"paintcan","figma":{"id":"0:624","file":"FP7lqd1V00LUaT5zvdklkkZr"},"keywords":["style","theme","art","color"],"width":12,"height":16,"path":"<path fill-rule=\"evenodd\" d=\"M6 0C2.69 0 0 2.69 0 6v1c0 .55.45 1 1 1v5c0 1.1 2.24 2 5 2s5-.9 5-2V8c.55 0 1-.45 1-1V6c0-3.31-2.69-6-6-6zm3 10v.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V10c0-.28-.22-.5-.5-.5s-.5.22-.5.5v2.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-2c0-.28-.22-.5-.5-.5s-.5.22-.5.5v.5c0 .55-.45 1-1 1s-1-.45-1-1v-1c-.55 0-1-.45-1-1V7.2c.91.49 2.36.8 4 .8 1.64 0 3.09-.31 4-.8V9c0 .55-.45 1-1 1zM6 7c-1.68 0-3.12-.41-3.71-1C2.88 5.41 4.32 5 6 5c1.68 0 3.12.41 3.71 1-.59.59-2.03 1-3.71 1zm0-3c-2.76 0-5 .89-5 2 0-2.76 2.24-5 5-5s5 2.24 5 5c0-1.1-2.24-2-5-2z\"/>"}}
},{}],36:[function(require,module,exports){
var data = require('./build/data.json')
var objectAssign = require('object-assign')

Object.keys(data).forEach(function(key) {

  // Returns a string representation of html attributes
  var htmlAttributes = function(icon, options) {
    var attributes = []
    var attrObj = objectAssign({}, data[key].options, options)

    // If the user passed in options
    if (options) {

      // If any of the width or height is passed in
      if(options["width"] || options["height"]) {
        attrObj["width"] = options["width"] ? options["width"] : (parseInt(options["height"]) * data[key].options["width"] / data[key].options["height"])
        attrObj["height"] = options["height"] ? options["height"] : (parseInt(options["width"]) * data[key].options["height"] / data[key].options["width"])
      }

      // If the user passed in class
      if (options["class"]) {
        attrObj["class"] = "octicon octicon-" + key + " " + options["class"]
        attrObj["class"].trim()
      }

      // If the user passed in aria-label
      if (options["aria-label"]) {
        attrObj["aria-label"] = options["aria-label"]
        attrObj["role"] = "img"

        // Un-hide the icon
        delete attrObj["aria-hidden"]
      }
    }

    Object.keys(attrObj).forEach(function(option) {
      attributes.push(option + "=\"" + attrObj[option] + "\"")
    })

    return attributes.join(" ").trim()
  }

  // Set the symbol for easy access
  data[key].symbol = key

  // Set all the default options
  data[key].options = {
    "version": "1.1",
    "width": data[key].width,
    "height": data[key].height,
    "viewBox": "0 0 " + data[key].width + " " + data[key].height,
    "class": "octicon octicon-" + key,
    "aria-hidden": "true"
  }

  // Function to return an SVG object
  data[key].toSVG = function(options) {
    return "<svg " + htmlAttributes(data[key], options) + ">" + data[key].path + "</svg>"
  }
})

// Import data into exports
module.exports = data

},{"./build/data.json":35,"object-assign":34}]},{},[16])
//# sourceMappingURL=my-repos.js.map
