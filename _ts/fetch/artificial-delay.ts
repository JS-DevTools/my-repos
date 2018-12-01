import { DEFAULT_DELAY, random } from "../util";

export const config = {
  delay: DEFAULT_DELAY,
};

/**
 * Introduces an artificial delay during local development to simulate internet latency
 */
export async function artificialDelay(): Promise<void> {
  let milliseconds = 0;

  if (config.delay) {
    milliseconds = random(0, config.delay);
  }

  await new Promise<unknown>((resolve) => setTimeout(resolve, milliseconds));
}
