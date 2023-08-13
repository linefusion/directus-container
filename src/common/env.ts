import { loadSync } from "@wolfpkgs/core/env";

export function loadEnv<T extends Record<any, any>>(
  def: T = {} as T
): T & Partial<Record<any, any>> {
  const env: Record<any, any> = {
    ...def,
    ...process.env,
  };

  Object.entries(loadSync()).forEach(([key, value]) => {
    env[key as any] = value;
  });

  return env;
}
