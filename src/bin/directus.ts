#!/usr/bin/env node

import { loadSync } from "@wolfpkgs/core/env";
import { dynamicImport } from "@wolfpkgs/core/modules";

Object.entries(loadSync()).forEach(([key, value]) => {
  process.env[key] = value;
});

export async function main() {
  await dynamicImport("@directus/api/cli/run.js");
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
