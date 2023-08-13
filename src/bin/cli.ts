#!/usr/bin/env node

export async function main() {
  console.log("cli");
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
