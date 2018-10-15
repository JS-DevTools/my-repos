(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("./dom");
const params_1 = require("./params");
class EditUrlDialog {
    constructor() {
        dom_1.dom.edit.form.addEventListener("submit", this.includeRepo.bind(this));
        dom_1.dom.edit.exclude.addEventListener("click", this.excludeRepo.bind(this));
    }
    showModal() {
        this.updateUI();
        let me = dom_1.dom.edit.dialog;
        me.className = "open";
        if (typeof me.showModal === "function") {
            me.showModal();
        }
        else {
            // <dialog> Polyfill
            let backdrop = dom_1.dom.createElement("div", { className: "backdrop" });
            me.insertAdjacentElement("afterend", backdrop);
            me.setAttribute("open", "");
        }
    }
    close() {
        let me = dom_1.dom.edit.dialog;
        me.className = "closed";
        if (typeof me.close === "function") {
            me.close();
        }
        else {
            // <dialog> Polyfill
            me.removeAttribute("open");
            let backdrop = me.nextElementSibling;
            if (backdrop && backdrop.className === "backdrop") {
                backdrop.remove();
            }
        }
    }
    includeRepo(event) {
        event.preventDefault();
        let repoName = this.getFullRepoName();
        if (!repoName) {
            return;
        }
        params_1.params.include(repoName);
        dom_1.dom.edit.repoOwner.value = "";
        dom_1.dom.edit.repoName.value = "";
        this.updateUI();
    }
    excludeRepo() {
        let repoName = this.getFullRepoName();
        if (!repoName) {
            return;
        }
        this.updateUI();
    }
    getFullRepoName() {
        let owner = dom_1.dom.edit.repoOwner.value.trim().toLowerCase();
        let repo = dom_1.dom.edit.repoName.value.trim().toLowerCase();
        if (owner && repo) {
            return `${owner}/${repo}`;
        }
    }
    updateUI() {
        if (params_1.params.isNew) {
            dom_1.dom.edit.cancel.style.display = "none";
            dom_1.dom.edit.ok.innerText = "Show My Dashboard";
        }
        else {
            dom_1.dom.edit.cancel.style.display = "";
            dom_1.dom.edit.ok.innerText = "Update Dashboard";
        }
        if (params_1.params.isEmpty) {
            dom_1.dom.edit.ok.disabled = true;
        }
    }
}
exports.dialog = new EditUrlDialog();
},{"./dom":2,"./params":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dom = {
    createElement,
    edit: {
        dialog: getElement("edit_dialog"),
        form: getElement("edit_url_form"),
        repoOwner: getElement("repo_owner"),
        repoName: getElement("repo_name"),
        include: getElement("include_button"),
        exclude: getElement("exclude_button"),
        cancel: getElement("cancel_button"),
        ok: getElement("ok_button"),
    }
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
const params_1 = require("./params");
if (params_1.params.isEmpty) {
    dialog_1.dialog.showModal();
}
},{"./dialog":1,"./params":4}],4:[function(require,module,exports){
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
    include(repoName) {
        let includedRepos = this._query.getAll("include");
        let excludedRepos = this._query.getAll("exclude");
        if (excludedRepos.includes(repoName)) {
            // Remove this repo from the exclude list
            this._query.delete("exclude");
            for (let excludedRepo of excludedRepos) {
                if (excludedRepo !== repoName) {
                    this._query.append("exclude", excludedRepo);
                }
            }
        }
        if (!includedRepos.includes(repoName)) {
            this._query.append("include", repoName);
        }
    }
    exclude(repoName) {
        // TODO
    }
    toString() {
        this._query.sort();
        return this._query.toString();
    }
}
exports.params = new Params();
},{}]},{},[3])
//# sourceMappingURL=repo-health.js.map
