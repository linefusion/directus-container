#!/usr/bin/env node

import fs from "node:fs";
import { execute } from "../common/utils";

export async function main() {
  const packages: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    optionalDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
  } = {
    dependencies: {},
    devDependencies: {},
    optionalDependencies: {},
    peerDependencies: {},
  };

  const sources: Record<keyof typeof packages, string> = {
    dependencies: "--save-prod",
    devDependencies: "--save-dev",
    peerDependencies: "--save-peer",
    optionalDependencies: "--save-optional",
  };

  if (fs.existsSync("/tmp/package.json")) {
    const pkg = require("/tmp/package.json");
    for (const key of Object.keys(sources)) {
      if (!(key in pkg)) {
        continue;
      }
      const k = key as keyof typeof packages;
      packages[k] = {
        ...packages[k],
        ...pkg[k],
      };
    }
  }

  if (fs.existsSync("/tmp/directus-extensions.json")) {
    const pkg = require("/tmp/directus-extensions.json");
    packages["dependencies"] = {
      ...pkg,
    };
  }

  console.log("Installing detected packages");
  for (const [key, value] of Object.entries(packages)) {
    const k = key as keyof typeof packages;
    const pkgs = Object.entries(value).map(
      ([name, version]) => `${name}@${version}`
    );
    if (pkgs.length <= 0) {
      continue;
    }
    await execute("pnpm", ["install", sources[k], ...pkgs], {});
  }
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
