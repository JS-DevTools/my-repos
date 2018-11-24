import { App } from "./components/app";
import { stateStore } from "./state-store";
import { mountTo, patch } from "./virtual-dom";

let app = App();
mountTo(document.body, app);

stateStore.onStateChange((event) => {
  let oldApp = app;
  let newApp = App();
  patch(document.body, oldApp, newApp);
});
