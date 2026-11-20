// Wrapper around the generated libcurl transport (../curl/index.mjs).
// The libcurl WebAssembly engine loads asynchronously. If the proxy sends its first request
// before the engine has finished starting, libcurl throws "wasm not loaded yet". This wrapper
// simply waits and retries until the engine is ready (up to 60 seconds).
// It lives outside /curl/ because the deploy script deletes and regenerates /curl/ every time.
import LibcurlClient from "../curl/index.mjs";

export default class LibcurlReadyClient extends LibcurlClient {
  async init() {
    const deadline = Date.now() + 60000;
    for (;;) {
      try {
        await super.init();
        return;
      } catch (err) {
        const msg = String((err && err.message) || err);
        if (!/wasm not loaded/i.test(msg) || Date.now() > deadline) throw err;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
  }
}
