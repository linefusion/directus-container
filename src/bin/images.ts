#!/usr/bin/env tsx

import _ from "lodash";
import fs from "node:fs";

import { execute } from "../common/utils";
import { Release } from "../common/types";

import semver from "semver";

const VERSIONS_FILE = __dirname + "/../versions.json";

export async function main() {
  const directus: Record<string, Release> = JSON.parse(
    fs.readFileSync(VERSIONS_FILE, { encoding: "utf-8" }).toString()
  );

  const targets = ["base", "runtime", "onbuild"];
  const envs = [
    { name: "production", tag: "" },
    {
      name: "development",
      tag: "-dev",
    },
  ];

  const pushes: Promise<any>[] = [];

  //for (const base of bases) {
    for (const version of ["latest", ...Object.keys(directus)]) {
      for (const target of targets) {
        for (const env of envs) {

          const pkg = version == "latest" ? directus[semver.sort(Object.keys(directus)).pop()!] : directus[version];
          const api = pkg!.packages.find(({ name }) => name == "@directus/api")!;

          const baseVersion = semver.coerce(pkg?.engines?.node ?? "20")?.major.toString() ?? "20";

          const baseImage = `node:${baseVersion}-alpine`;

          const tag = `${version}-${baseImage.replace(":", "")}-${target}${env.tag}`;
          const fqdn = `linefusion/directus:${tag}`;

          try {
            const exists = await fetch(
              `https://hub.docker.com/v2/repositories/linefusion/directus/tags/${tag}/`
            );
            if (exists.status != 404 && version != "latest") {
              continue;
            }
          } catch (err) {
            console.log(err);
            continue;
          }

          console.log(`
---------------------------------------------------------

  Building Directus

     FQDN: ${fqdn}
     Base: ${baseImage}

  Version: v${version}
      API: v${api.version}

     Node: ${baseVersion}
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
              fqdn,
              "--build-arg",
              `NODE_ENV=${env.name}`,
              "--build-arg",
              `BASE_IMAGE=${baseImage}`,
              "--build-arg",
              `DIRECTUS_VERSION=${version}`,
              "--build-arg",
              `DIRECTUS_API_VERSION=${api.version}`,
              "./docker",
            ],
            {}
          );

          pushes.push(execute("docker", ["push", fqdn], {}));
        }
      }
    }
//  }

  await Promise.all(pushes);
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
