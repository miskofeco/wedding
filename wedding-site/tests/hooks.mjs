// Loaded with `node --import` before the tests. The app's modules import each
// other without a file extension, as the bundler allows; Node needs `.ts`.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (err) {
      if (err?.code !== "ERR_MODULE_NOT_FOUND" || !/^\.\.?\//.test(specifier)) throw err;
      return next(`${specifier}.ts`, context);
    }
  },
});
