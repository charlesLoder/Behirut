const esbuild = require("esbuild");

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require("esbuild-node-externals");

esbuild
  .build({
    entryPoints: ["./src/background.ts"],
    outfile: "./src/background.min.js",
    bundle: true,
    minify: true,
    platform: "browser",
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
esbuild
  .build({
    entryPoints: ["./src/custom_fonts.ts"],
    outfile: "./src/custom_fonts.min.js",
    bundle: true,
    minify: true,
    platform: "browser",
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
esbuild
  .build({
    entryPoints: ["./src/main.ts"],
    outfile: "./src/main.min.js",
    bundle: true,
    minify: true,
    platform: "browser",
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
esbuild
  .build({
    entryPoints: ["./src/popup.ts"],
    outfile: "./src/popup.min.js",
    bundle: true,
    minify: true,
    platform: "browser",
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
