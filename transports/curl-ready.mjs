// Wrapper around the generated libcurl transport (../curl/index.mjs).
// The libcurl WebAssembly module can still be initializing when Scramjet sends its first
// request. Retry that specific transient error, but also bound each init attempt so a missing
// or failed WASM load cannot leave the proxy worker waiting forever.
import LibcurlClient from "../curl/index.mjs";

const INIT_TIMEOUT_MS = 45000;
const RETRY_DELAY_MS = 150;
const ATTEMPT_TIMEOUT_MS = 10000;

export default class LibcurlReadyClient extends LibcurlClient {
  async init() {
    const deadline = Date.now() + INIT_TIMEOUT_MS;
    let lastError = null;

    while (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      let timer;
      try {
        await Promise.race([
          super.init(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error('libcurl WebAssembly initialization did not finish within ' +
                Math.min(ATTEMPT_TIMEOUT_MS, remaining) / 1000 + ' seconds. Check curl/libcurl.wasm and its network response.')),
              Math.min(ATTEMPT_TIMEOUT_MS, remaining)
            );
          })
        ]);
        return;
      } catch (err) {
        lastError = err;
        const msg = String((err && err.message) || err);
        if (!/wasm not loaded/i.test(msg) && !/WebAssembly initialization did not finish/i.test(msg)) {
          throw err;
        }
        const wait = Math.min(RETRY_DELAY_MS, Math.max(0, deadline - Date.now()));
        if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('libcurl did not become ready within ' + INIT_TIMEOUT_MS / 1000 +
      ' seconds: ' + String((lastError && lastError.message) || lastError || 'unknown error'));
  }
}
