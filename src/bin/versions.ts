#!/usr/bin/env tsx

import fs from "node:fs";
import semver from "semver";
import { memoize } from "../common/utils";
import { RawPackument, getRawPackument } from "query-registry";

import _ from "lodash";
import { Reference, Release } from "../common/types";

const VERSIONS_FILE = __dirname + "/../versions.json";

const cache = {
  releases: {} as Record<string, Release[]>,
  release: {} as Record<string, Release>,
  explored: {} as Record<string, boolean>,
};

const getPackageReleases = memoize(async (name: string): Promise<Release[]> => {
  if (name in cache.releases) {
    console.log("using cached releases for", name);
    return cache.releases[name]!;
  }

  let pkg: RawPackument;
  try {
    pkg = await getRawPackument({
      name,
    });
  } catch (e) {
    if (e.response?.statusText == "Not Found") {
      return [];
    } else {
      throw e;
    }
  }

  const releases = Object.keys(pkg?.versions || {})
    .filter((version) => {
      if (semver.valid(version)) {
        return true;
      } else {
        console.log("package version is invalid", { name, version });
        return false;
      }
    })
    .sort(semver.compare)
    .reverse()
    .map(
      (version): Release => ({
        name,
        version,
        engines: pkg.versions[version]?.engines || {},
        packages: [],
        references: ([] as [string, string, Reference["type"]][])
          .concat(
            Object.entries(pkg.versions[version]?.dependencies || {}).map(
              (v) => [...v, "dependencies"]
            )
          )
          //.concat(
          //  Object.entries(pkg.versions[version]?.devDependencies || {}).map(
          //    (v) => [...v, "devDependencies"]
          //  )
          //)
          .concat(
            Object.entries(pkg.versions[version]?.peerDependencies || {}).map(
              (v) => [...v, "peerDependencies"]
            )
          )
          .concat(
            Object.entries(
              pkg.versions[version]?.optionalDependencies || {}
            ).map((v) => [...v, "optionalDependencies"])
          )
          .map(
            ([refName, refVersion, refType]): Reference => ({
              source: name,
              name: refName,
              version: refVersion,
              type: refType as any as Reference["type"],
            })
          ),
      })
    );

  releases.forEach((release) => {
    cache.release[`${release.name}@${release.version}`] = release;
  });

  return (cache.releases[name] = releases);
});

async function getLatestReleaseFor(name: string, version: string) {
  const releases = await getPackageReleases(name);
  return releases.find((release) => semver.satisfies(release.version, version));
}

async function expandPackage(
  release: Release,
  packages: Record<string, Release[]> = {}
) {
  const k = `${release.name}@${release.version}`;
  if (k in cache.explored) {
    return packages;
  } else {
    cache.explored[k] = true;
  }

  packages[release.name] = packages[release.name] || [];
  if (packages[release.name]?.find((rel) => rel.version === release.version)) {
    return packages;
  }

  packages[release.name]!.push(release);

  await Promise.all(
    release.references.map(async (reference) => {
      const rel = await getLatestReleaseFor(reference.name, reference.version);
      if (!rel) {
        console.log("could not find release for reference", reference);
        return;
      }
      await expandPackage(rel, packages);
    })
  );

  return packages;
}

export async function main() {
  if (!fs.existsSync(VERSIONS_FILE)) {
    fs.writeFileSync(VERSIONS_FILE, "{}");
  }

  const directus: Record<string, Release[]> = JSON.parse(
    fs.readFileSync(VERSIONS_FILE, { encoding: "utf-8" }).toString()
  );

  const releases = (await getPackageReleases("directus")).filter(
    (release) =>
      semver.gte(release.version, "10.0.0") &&
      !(release.version in directus) &&
      !semver.prerelease(release.version)
  );

  let packages: Record<string, Release[]> = {};
  for (const release of releases) {
    await expandPackage(release, packages);
  }

  async function flatten(
    release: Release,
    refs: Reference[] = []
  ): Promise<Reference[]> {
    await Promise.all(
      release.references.map(async (reference) => {
        if (
          refs.find(
            (ref) =>
              ref.name === reference.name && ref.version === reference.version
          )
        ) {
          return;
        }

        const latest = await getLatestReleaseFor(
          reference.name,
          reference.version
        );

        if (!latest) {
          return;
        }

        refs.push({
          ...reference,
          resolved: latest.version,
        });

        const referenceRelease = packages[reference.name]?.find(
          (rel) => rel.version === reference.version
        )!;

        if (!referenceRelease) {
          return [];
        }

        return await flatten(referenceRelease, refs);
      })
    );

    return refs;
  }

  function isDirectusReference(ref: Reference) {
    return ref.name == "directus" || ref.name.startsWith("@directus/");
  }

  const output = {} as any;
  for (const release of releases) {
    const root = packages[release.name]?.find(
      (rel) => rel.version === release.version
    )!;
    const references = await flatten(root);
    root.references = references.filter((ref) => !isDirectusReference(ref));
    root.packages = references.filter(isDirectusReference);
    root.references = _.uniqWith(root.references, _.isEqual);
    root.packages = _.uniqWith(root.packages, _.isEqual);
    output[release.version] = root;
  }

  fs.writeFileSync(
    VERSIONS_FILE,
    JSON.stringify(
      {
        ...output,
        ...directus,
      },
      null,
      2
    )
  );
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
