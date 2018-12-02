import { stateStore } from "../state-store";
import { random } from "../util";

/**
 * Introduces an artificial delay during local development to simulate internet latency
 */
export async function artificialDelay(): Promise<void> {
  let { delay } = stateStore.state;
  let milliseconds = 0;

  if (delay) {
    milliseconds = random(0, delay);
  }

  await new Promise<unknown>((resolve) => setTimeout(resolve, milliseconds));
}
