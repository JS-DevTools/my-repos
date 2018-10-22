(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const params_1 = require("../params");
const edit_dashboard_modal_1 = require("./edit-dashboard-modal");
function App() {
    if (params_1.params.isNew) {
        return React.createElement(edit_dashboard_modal_1.EditDashboardModal, null);
    }
    else {
        return React.createElement("div", null, "Hello, world");
    }
}
exports.App = App;
},{"../params":5,"./edit-dashboard-modal":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EditDashboardForm extends React.Component {
    getInitialState() {
        return {
            accountName: ""
        };
    }
    render() {
        return (React.createElement("form", { id: "add_account_form" },
            React.createElement("div", { className: "clearfix" },
                React.createElement("dl", { className: "form-group" },
                    React.createElement("dt", { className: "input-label" },
                        React.createElement("label", { htmlFor: "repo_owner" }, "GitHub Username")),
                    React.createElement("dd", { className: "input-field" },
                        React.createElement("input", { type: "text", name: "account_name", autoFocus: true, maxLength: 100, autoCapitalize: "off", autoComplete: "off", spellCheck: false, className: "form-control short" }))),
                React.createElement("button", { type: "submit", className: "btn btn-primary" }, "Add"))));
    }
    async addAccount(event) {
        event.preventDefault();
        // let accountName = dom.editDashboard.accountName.value.trim();
        // await fetchRepos(accountName);
        // dom.editDashboard.accountName.value = "";
    }
}
exports.EditDashboardForm = EditDashboardForm;
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const params_1 = require("../params");
const edit_dashboard_form_1 = require("./edit-dashboard-form");
function EditDashboardModal() {
    return (React.createElement("div", { className: "dialog-container" },
        React.createElement("dialog", { open: true, className: "open" },
            React.createElement("header", { className: "dialog-header" },
                React.createElement("img", { className: "logo", src: "img/logo.png", alt: "logo image" }),
                React.createElement("h1", null, "GitHub Repo Health"),
                React.createElement("h2", null, "See the health of all your GitHub repos on one page")),
            React.createElement("div", { className: "dialog-body" },
                React.createElement("h3", null, getTitle()),
                React.createElement(edit_dashboard_form_1.EditDashboardForm, null)),
            React.createElement("footer", { className: "dialog-footer" },
                React.createElement("button", { type: "button", disabled: true, className: "btn" }, "Cancel"),
                React.createElement("button", { type: "button", disabled: true, className: "btn btn-primary" }, "Create My Dashboard"))),
        React.createElement("div", { className: "backdrop" })));
}
exports.EditDashboardModal = EditDashboardModal;
function getTitle() {
    if (params_1.params.isNew) {
        return "Hi! 👋 Enter your GitHub username below to get started";
    }
    else {
        return "Edit Your Dashboard";
    }
}
},{"../params":5,"./edit-dashboard-form":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./components/app");
ReactDOM.render(React.createElement(app_1.App, null), document.getElementById("react-app"));
},{"./components/app":1}],5:[function(require,module,exports){
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
},{}]},{},[4])
//# sourceMappingURL=repo-health.js.map
