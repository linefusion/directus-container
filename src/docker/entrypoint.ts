#!/usr/bin/env node

import fs, { chmod } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { SpawnOptions, spawn } from "node:child_process";
import semver from "semver";

const {
  DIRECTUS_APP,
  DIRECTUS_VERSION,
  DIRECTUS_PACKAGES_ENABLED,
  NODE_PACKAGES,
  ...env
} = process.env;

async function getPackagesPath(file: string): Promise<string> {
  if (!fs.existsSync("/directus/extensions/.packages")) {
    await fsp.mkdir("/directus/extensions/.packages", {
      recursive: true,
    });
  }

  return path.join("/directus/extensions/.packages", file);
}

function isCachePersistent(): boolean {
  return !fs.existsSync("/directus/extensions/.packages/.gitkeep");
}

async function createModulesCache(target: string): Promise<boolean> {
  if (fs.existsSync(target)) {
    return false;
  }
  console.log("Caching 'node_modules'...");
  await execute("tar", ["-cf", target, "node_modules"], {});
  return true;
}

async function restoreModulesCache(target: string) {
  if (!fs.existsSync(target)) {
    return false;
  }
  console.log("Restoring 'node_modules' from cache...");
  await execute("tar", ["-xf", target], {});
  return true;
}

async function createPackageJsonCache(target: string) {
  if (fs.existsSync(target)) {
    return false;
  }
  console.log("Caching 'package.json' file...");
  await fsp.writeFile(
    target,
    await fsp.readFile("package.json", {
      encoding: "utf-8",
    })
  );
  return true;
}

async function restorePackageJsonCache(target: string) {
  if (!fs.existsSync(target)) {
    return false;
  }
  console.log("Restoring 'package.json' from cache...");
  await fsp.writeFile(
    "package.json",
    await fsp.readFile(target, {
      encoding: "utf-8",
    })
  );
  return true;
}

async function execute(
  command: string,
  args: string[],
  options: SpawnOptions
): Promise<void> {
  return new Promise<void>((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });
    child.on("close", (code: number) => {
      if (code !== 0) {
        process.exit(code);
      }
      resolve();
    });
  });
}

type Reference = {
  name: string;
  version: string;
  resolved: string;
  source: string;
  type: string;
};

type Release = {
  name: string;
  version: string;
  engines: Partial<Record<string, string>> & {
    node?: string;
  };
  references: Reference[];
  packages: Reference[];
};

/**
 * Install Directus
 */
async function installDirectus() {
  let version: string = DIRECTUS_VERSION || "latest";
  const releases: Record<string, Release> = require(__dirname +
    "/../versions.json");
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
    console.log(`Installing packages: ${packages}`);
  }

  await execute("pnpm", ["install", "--prefer-offline", ...packages], {
    env: { ...env, CI: "true" },
  });
}

async function installExtensions() {
  if (!NODE_PACKAGES) {
    console.log("No packages to install.");
    return;
  }

  let packages: string[] | Record<string, string> = {};
  try {
    packages = JSON.parse((NODE_PACKAGES || "").trim());
    if (!Array.isArray(packages)) {
      if (typeof packages == "object") {
        const pkg = packages;
        packages = Object.keys(packages).map((name) => {
          return `${name}@${pkg[name] || "latest"}`;
        });
      } else {
        console.log("Invalid NODE_PACKAGES format.");
        process.exit(1);
      }
    }
  } catch (err) {
    packages = (NODE_PACKAGES || "").split(",").map((ext) => {
      const parts = ext.split("@");
      if (parts.length == 1) {
        return `${parts[0]}@latest`;
      } else if (parts.length == 2) {
        if (parts[0] == "") {
          return `@${parts[0]}@latest`;
        } else {
          return `${parts[0]}@${parts[1]}`;
        }
      } else if (parts.length == 3) {
        return `@${parts[1]}@${parts[2]}`;
      } else {
        throw new Error(`Invalid extension format: ${ext}`);
      }
    });
  }

  if (!Array.isArray(packages)) {
    console.log("Invalid NODE_PACKAGES format.");
    process.exit(1);
  }

  await execute("pnpm", ["install", "--prefer-offline", ...packages], {
    env: {
      ...env,
      CI: "true",
    },
  });
}

(async function main() {
  const app = DIRECTUS_APP || "directus";

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

  const containerModulesTar = await getPackagesPath(`${containerInfoHash}.tar`);
  const containerModulesJson = await getPackagesPath(
    `${containerInfoHash}.json`
  );

  await restorePackageJsonCache(containerModulesJson);
  if (await restoreModulesCache(containerModulesTar)) {
    return;
  }

  await installDirectus();
  await installExtensions();

  if (!isCachePersistent()) {
    console.log(
      "Skipping node_modules cache file because '/directus/extensions/.packages' is not persistent."
    );
    return;
  }

  await createPackageJsonCache(containerModulesJson);
  await createModulesCache(containerModulesTar);
})();
