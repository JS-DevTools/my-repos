import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./components/app";

ReactDOM.render(<App />, document.getElementById("react-app"));

// HACK: I'm not sure why, but the page scrolls to the bottom after the first render.
// This workaround prevents that.
window.scrollTo(0, 0);
