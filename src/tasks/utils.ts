import { exec } from "child_process";

const empty = Symbol();

export async function execute(command: string): Promise<{
  text(): string;
  json(defaultValue?: any): any;
}> {
  return new Promise((resolve, reject) => {
    const child = exec(command, {
      encoding: "utf-8",
    });

    const buffer: Buffer[] = [];
    child.stdout?.on("data", (chunk) => {
      if (typeof chunk == "string") {
        buffer.push(Buffer.from(chunk));
      } else if (chunk instanceof Buffer) {
        buffer.push(chunk);
      } else {
        throw new Error("Invalid chunk type");
      }
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        throw new Error(`Command "${command}" failed with exit code ${code}`);
      }

      const output = Buffer.concat(buffer).toString();
      resolve({
        text() {
          return output;
        },
        json(defaultValue: any = null) {
          if (output.length === 0) {
            return defaultValue;
          }
          return JSON.parse(output);
        },
      });
    });
  });
}

export function log(...args: any[]): void {
  console.log(...args);
}

export function pick(count: number, args: any[]) {
  const result = new Array(count).fill(empty);
  return result.map((value, index) => {
    if (index < args.length) {
      return args[index];
    } else {
      return value;
    }
  });
}

export function memoize<T extends (...args: any) => any>(
  fn: T,
  count: number = 0
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let cache: Record<any, any> = {};
  return <T>(async (...args: any[]) => {
    const keys = [empty, ...pick(count == 0 ? args.length : count, args)];
    let key = keys.length > 0 ? keys[keys.length - 1] : empty;
    let current = cache;
    for (let i = 0; i < keys.length - 1; i++) {
      if (keys[i] in current) {
        current = current[keys[i]].cache;
      } else {
        current[keys[i]] = {
          cache: {},
        };
        current = current[keys[i]].cache;
      }
    }

    if (key in current) {
      return current[key];
    }

    try {
      current[key] = fn(...args);
      current[key] = await current[key];
    } catch (error) {
      delete current[key];
      throw error;
    }

    return current[key];
  });
}
