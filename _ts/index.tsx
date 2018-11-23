import { h, mount } from "petit-dom";
import { App } from "./components/app";

let app = <App />;
let element = mount(app) as HTMLBodyElement;
document.body = element;
