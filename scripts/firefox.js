"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zip_1 = require("./zip");
const replace = require("replace-in-file");
(async () => {
  try {
    console.log("Converting to Firefox...");
    const options = {
      files: "./src/**",
      from: /chrome-extension/g,
      to: "moz-extension",
    };
    const results = await replace(options);
    console.log("Conversion results:", results);
    zip_1.default("Firefox-1.0.0");
  } catch (error) {
    console.error("Error occurred:", error);
  }
})();
