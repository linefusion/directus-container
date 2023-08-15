#!/usr/bin/env tsx

import _ from "lodash";
import fs from "node:fs";

import { execute } from "../common/utils";
import { Release } from "../common/types";

const VERSIONS_FILE = __dirname + "/../versions.json";

export async function main() {
  const directus: Record<string, Release> = JSON.parse(
    fs.readFileSync(VERSIONS_FILE, { encoding: "utf-8" }).toString()
  );

  const bases = ["node:20-alpine"];
  const targets = ["base", "runtime", "onbuild"];
  const envs = [
    { name: "production", tag: "" },
    {
      name: "development",
      tag: "-dev",
    },
  ];

  for (const base of bases) {
    for (const version of Object.keys(directus)) {
      for (const target of targets) {
        for (const env of envs) {
          const api = directus[version]!.packages.find(
            (pkg) => pkg.name == "@directus/api"
          )!;
          const tag = `linefusion/directus:${version}-${base.replace(
            ":",
            ""
          )}-${target}${env.tag}`;

          console.log(`
---------------------------------------------------------

  Building Directus

      Tag: ${tag}

  Version: v${version}
      API: v${api.version}

     Node: ${base}
      Env: ${env.name}
   Target: ${target}

---------------------------------------------------------
        `);

          await execute(
            "docker",
            [
              "build",
              "--target",
              target,
              "--tag",
              tag,
              "--build-arg",
              `NODE_ENV=${env.name}`,
              "--build-arg",
              `BASE_IMAGE=${base}`,
              "--build-arg",
              `DIRECTUS_VERSION=${version}`,
              "--build-arg",
              `DIRECTUS_API_VERSION=${api.version}`,
              "./docker",
            ],
            {}
          );

          await execute("docker", ["push", tag], {});
        }
      }
      return;
    }
  }
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
