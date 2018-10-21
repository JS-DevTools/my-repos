(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("./dom");
class Dialog {
    constructor(element) {
        this._element = element;
    }
    showModal() {
        this.updateUI();
        this._element.className = "open";
        if (typeof this._element.showModal === "function") {
            this._element.showModal();
        }
        else {
            // <dialog> Polyfill
            let backdrop = dom_1.dom.createElement("div", { className: "backdrop" });
            this._element.insertAdjacentElement("afterend", backdrop);
            this._element.setAttribute("open", "");
        }
    }
    close() {
        this._element.className = "closed";
        if (typeof this._element.close === "function") {
            this._element.close();
        }
        else {
            // <dialog> Polyfill
            this._element.removeAttribute("open");
            let backdrop = this._element.nextElementSibling;
            if (backdrop && backdrop.className === "backdrop") {
                backdrop.remove();
            }
        }
    }
}
exports.Dialog = Dialog;
},{"./dom":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dom = {
    createElement,
    editDashboard: {
        dialog: getElement("edit_dashboard_dialog"),
        form: getElement("edit_dashboard_form"),
        accountName: getElement("account_name"),
        add: getElement("add_button"),
        cancel: getElement("cancel_button"),
        ok: getElement("ok_button"),
    },
};
function getElement(id) {
    let element = document.getElementById(id);
    if (!element) {
        throw new Error(`Unable to find the element "${id}"`);
    }
    return element;
}
function createElement(tagName, props = {}) {
    let element = document.createElement(tagName);
    for (let prop of Object.keys(props)) {
        // @ts-ignore
        element[prop] = props[prop];
    }
    return element;
}
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
const dom_1 = require("./dom");
const params_1 = require("./params");
class EditDashboardDialog extends dialog_1.Dialog {
    constructor() {
        super(dom_1.dom.editDashboard.dialog);
        dom_1.dom.editDashboard.form.addEventListener("submit", this.addAccount.bind(this));
        dom_1.dom.editDashboard.add.addEventListener("click", this.addAccount.bind(this));
    }
    updateUI() {
        if (params_1.params.isEmpty) {
            dom_1.dom.editDashboard.ok.disabled = true;
        }
    }
    async addAccount(event) {
        event.preventDefault();
        let accountName = dom_1.dom.editDashboard.accountName.value.trim();
        // await fetchRepos(accountName);
        dom_1.dom.editDashboard.accountName.value = "";
    }
}
exports.editDashboardDialog = new EditDashboardDialog();
},{"./dialog":1,"./dom":2,"./params":5}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const edit_dashboard_dialog_1 = require("./edit-dashboard-dialog");
const params_1 = require("./params");
if (params_1.params.isNew) {
    edit_dashboard_dialog_1.editDashboardDialog.showModal();
}
},{"./edit-dashboard-dialog":3,"./params":5}],5:[function(require,module,exports){
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
    include(owner, repo = "") {
        let fullName = repo ? `${owner}/${repo}` : owner;
        let includedRepos = this._query.getAll("include");
        let excludedRepos = this._query.getAll("exclude");
        // Is this repo currently excluded?
        if (excludedRepos.some((excluded) => isSameRepo(excluded, fullName))) {
            // Delete the "exclude" list (there's no method to remove a single item from it)
            this._query.delete("exclude");
            // Re-create the "exclude" list without this repo
            for (let excludedRepo of excludedRepos) {
                if (!isSameRepo(excludedRepo, fullName)) {
                    this._query.append("exclude", excludedRepo);
                }
            }
        }
        if (!includedRepos.includes(fullName)) {
            this._query.append("include", fullName);
        }
    }
    exclude(owner, repo) {
        // TODO
    }
    toString() {
        this._query.sort();
        return this._query.toString();
    }
}
function isSameRepo(repoA, repoB) {
    return repoA.toLowerCase() === repoB.toLowerCase();
}
exports.params = new Params();
},{}]},{},[4])
//# sourceMappingURL=repo-health.js.map
