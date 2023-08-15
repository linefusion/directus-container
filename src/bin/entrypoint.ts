#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import semver from "semver";
import { Release } from "../common/types";
import { extractPackages } from "../common/packages";
import { execute } from "../common/utils";

const releases: Record<string, Release> = require(__dirname +
  "/../versions.json");

const {
  DIRECTUS_INSTANCE_ID,
  DIRECTUS_VERSION,
  DIRECTUS_PACKAGES_ENABLED,
  NODE_PACKAGES,
  ENTRYPOINT_INSTALL,
  ...env
} = process.env;

async function getCachePath(file: string): Promise<string> {
  if (!fs.existsSync("/directus/node_modules")) {
    await fsp.mkdir("/directus/node_modules", {
      recursive: true,
    });
  }

  return path.join("/directus/node_modules", file);
}

async function cachePackageJson(hash: string) {
  const packagePath = await getCachePath(`${hash}.package.json`);

  await fsp.writeFile(
    packagePath,
    await fsp.readFile("package.json", {
      encoding: "utf-8",
    })
  );

  const lockPath = await getCachePath(`${hash}.pnpm-lock.yaml`);
  await fsp.writeFile(
    lockPath,
    await fsp.readFile("pnpm-lock.yaml", {
      encoding: "utf-8",
    })
  );

  return true;
}

async function restorePackageJson(hash: string) {
  console.log("Restoring 'package.json' from cache...");

  const packagePath = await getCachePath(`${hash}.package.json`);
  if (!fs.existsSync(packagePath)) {
    return false;
  }

  await fsp.writeFile(
    "package.json",
    await fsp.readFile(packagePath, {
      encoding: "utf-8",
    })
  );

  const lockPath = await getCachePath(`${hash}.pnpm-lock.yaml`);
  if (fs.existsSync(lockPath)) {
    await fsp.writeFile(
      "pnpm-lock.yaml",
      await fsp.readFile(lockPath, {
        encoding: "utf-8",
      })
    );
  }

  return true;
}

export async function installDefault() {
  await execute("pnpm", ["install", "--prefer-offline"], {
    env,
  });
}

export function getDirectusVersion() {
  let version: string = DIRECTUS_VERSION || "latest";
  if (version != "latest" && !(version in releases)) {
    console.log(
      `\n` +
        `ERROR: Invalid or unknown Directus version "${version}".\n` +
        `       You might want to check if there's a new version of this image\n` +
        `       or if you're targeting a valid version.\n`
    );
    process.exit(1);
  }

  if (version == "latest") {
    version = Object.keys(releases).sort(semver.compare).reverse()[0]!;
    console.log(
      `\n` +
        `WARN: Using "latest" version might not be the actual latest one.\n` +
        `      Make sure to also be using the latest version of this image.\n`
    );
  }

  const release = releases[version]!;

  return { release, version };
}

/**
 * Install Directus
 */
export async function installDirectus({
  release,
  version,
}: {
  release: Release;
  version: string;
}) {
  const packages: string[] = [];

  const api = release.packages.find((pkg) => pkg.name == "@directus/api")!;
  packages.push(`@directus/api@${api.resolved}`);

  console.log(`Installing Directus ${version}...`);

  if (DIRECTUS_PACKAGES_ENABLED == "true") {
    packages.push(
      ...release.references
        .filter(
          (ref) =>
            ref.source == "@directus/api" && ref.type == "optionalDependencies"
        )
        .map((ref) => `${ref.name}@${ref.version}`)
    );
    console.log(`Installing packages...`);
  }

  await execute("pnpm", ["install", "--prefer-offline", ...packages], {
    env,
  });
}

export async function installExtensions() {
  let packages: string[] = extractPackages(NODE_PACKAGES || "");
  if (packages.length <= 0) {
    console.log("No packages to install.");
    return;
  }

  console.log(`Installing extensions...`);
  await execute("pnpm", ["install", "--prefer-offline", ...packages], {
    env,
  });
}

export async function main() {
  if (ENTRYPOINT_INSTALL != "true") {
    return;
  }

  const app = DIRECTUS_INSTANCE_ID || "directus";

  const { version, release } = getDirectusVersion();

  const containerInfo =
    `app=${app}\n` +
    `version=${DIRECTUS_VERSION || "latest"}\n` +
    `packages=${DIRECTUS_PACKAGES_ENABLED || "true"}\n` +
    `dependencies=${NODE_PACKAGES || ""}\n`;

  const containerInfoHash = crypto
    .createHash("sha256")
    .update(containerInfo)
    .digest("hex")
    .toString();

  if (!(await restorePackageJson(containerInfoHash))) {
    await installDirectus({ version, release });
    await installExtensions();
  } else {
    await installDefault();
  }

  await cachePackageJson(containerInfoHash);
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
