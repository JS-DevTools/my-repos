/**
 * Yes, I know I'm reinventing the wheel here.  There are already plenty of virtual DOM implementations,
 * and certainly plenty of ones that are better than this one.  This implemenation only has the
 * functionality that's needed by this app, which makes it lightweight and optimized.  But mostly
 * I just wanted the experience of writing a vdom. 😊
 */

export { Component } from "./component";
export { h } from "./h";
export { mount, mountTo } from "./mount";
export { patch } from "./patch";
export { unmount, unmountFrom } from "./unmount";
