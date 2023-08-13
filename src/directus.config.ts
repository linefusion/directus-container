import crypto from "node:crypto";
import { loadEnv } from "./common/env";

export default function (env: Record<string, any>) {
  env = {
    ...loadEnv(),
    ...env,
  };

  const generated = {
    KEY: crypto.randomUUID(),
    SECRET: crypto.randomUUID(),
  };

  if (!env.KEY) {
    console.log(
      "WARN: Environment 'KEY' not found. Using temporary value for this session."
    );
  }

  if (!env.SECRET) {
    console.log(
      "WARN: Environment 'SECRET' not found. Using temporary value for this session."
    );
  }

  return {
    ...generated,
    ...env,
  };
}
