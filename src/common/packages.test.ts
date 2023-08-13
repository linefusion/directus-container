import { describe, expect, it } from "vitest";
import { extractPackages } from "./packages";

describe("packages", () => {
  it("should be able parse packages", () => {
    expect(extractPackages("pkg1,pkg2")).toEqual(["pkg1", "pkg2"]);
    expect(extractPackages("pkg1, pkg2")).toEqual(["pkg1", "pkg2"]);
    expect(extractPackages("pkg1 , pkg2")).toEqual(["pkg1", "pkg2"]);
    expect(extractPackages("pkg1@latest,pkg2@^1.0.0")).toEqual([
      "pkg1@latest",
      "pkg2@^1.0.0",
    ]);
    expect(extractPackages('["pkg1","pkg2"]')).toEqual(["pkg1", "pkg2"]);
    expect(
      extractPackages(`
        pkg1
        pkg2
      `)
    ).toEqual(["pkg1", "pkg2"]);
    expect(
      extractPackages(`
        pkg1
        pkg2@2
      `)
    ).toEqual(["pkg1", "pkg2@2"]);
    expect(
      extractPackages(`
        pkg1@latest
        pkg2@^1.0.0
      `)
    ).toEqual(["pkg1@latest", "pkg2@^1.0.0"]);
    expect(
      extractPackages(`
        @org/pkg1
        @org/pkg2
      `)
    ).toEqual(["@org/pkg1", "@org/pkg2"]);
    expect(
      extractPackages(`
        @org/pkg1@latest
        @org/pkg2@^1.0.0
      `)
    ).toEqual(["@org/pkg1@latest", "@org/pkg2@^1.0.0"]);
    expect(
      extractPackages(`
        @org/pkg1@latest,
        @org/pkg2@^1.0.0,
      `)
    ).toEqual(["@org/pkg1@latest", "@org/pkg2@^1.0.0"]);
  });
});
