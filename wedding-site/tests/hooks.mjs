// Loaded with `node --import` before the tests. The app's modules import each
// other without a file extension and through the `@/` alias, as the bundler
// allows; Node needs the path and `.ts`. Photos load as a stub, and the
// Next.js APIs that need a running request are small fakes (fakes/): the
// cookies are a jar the tests fill.
import { registerHooks } from "node:module";

const src = new URL("../src/", import.meta.url);
const fakes = {
  "next/headers": new URL("./fakes/next-headers.ts", import.meta.url).href,
  "next/navigation": new URL("./fakes/next-navigation.ts", import.meta.url).href,
};
const image = /\.(jpe?g|png|webp|avif)$/;

registerHooks({
  resolve(specifier, context, next) {
    if (specifier in fakes) return { url: fakes[specifier], shortCircuit: true };
    if (specifier.startsWith("@/")) specifier = new URL(specifier.slice(2), src).href;
    // Photos are git-ignored, so in CI the file isn't there; the stub below never reads it.
    if (image.test(specifier) && /^(\.\.?\/|file:)/.test(specifier)) {
      return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    }
    try {
      return next(specifier, context);
    } catch (err) {
      const missing = err?.code === "ERR_MODULE_NOT_FOUND" || err?.code === "ERR_UNSUPPORTED_DIR_IMPORT";
      if (!missing || !/^(\.\.?\/|file:)/.test(specifier)) throw err;
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        return next(`${specifier}/index.ts`, context);
      }
    }
  },
  load(url, context, next) {
    // What next/image's static import gives, without reading the file.
    if (image.test(url)) {
      return { format: "module", source: `export default { src: ${JSON.stringify(url)}, width: 1, height: 1 };`, shortCircuit: true };
    }
    return next(url, context);
  },
});
