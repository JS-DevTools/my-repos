import { stateStore } from "../state-store";
import { config } from "./artificial-delay";

export { fetch } from "./fetch";
export { ResponseMapper } from "./map-response";
export { FetchError } from "./fetch-error";
export * from "./fetch-response";

// Keep the artificial delay in sync with app state
stateStore.onStateChange(() => config.delay = stateStore.state.delay);
