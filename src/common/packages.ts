export function extractPackages(deps: string): string[] {
  deps = (deps || "").trim();

  let pkgs: any;
  try {
    pkgs = JSON.parse(deps);
  } catch (err) {
    pkgs = deps;
  }

  if (Array.isArray(pkgs)) {
    return pkgs.filter((pkg) => typeof pkg == "string");
  }

  if (typeof pkgs == "object") {
    return Object.entries(pkgs)
      .filter(
        ([name, version]) =>
          typeof name == "string" && typeof version == "string"
      )
      .map(([name, version]) => `${name}@${version}`);
  }

  if (typeof pkgs == "string") {
    return pkgs
      .split(/\n|,/)
      .map((dep) => dep.trim())
      .filter((dep) => dep != "");
  }

  return [];
}
