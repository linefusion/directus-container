#!/usr/bin/env node

import { loadSync } from "@wolfpkgs/core/env";
import { dynamicImport } from "@wolfpkgs/core/modules";

Object.entries(loadSync()).forEach(([key, value]) => {
  process.env[key] = value;
});

(async function main() {
  console.log({ argv: process.argv });

  //await dynamicImport("@directus/api/cli/run.js");
})();
