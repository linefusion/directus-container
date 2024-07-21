import { bold, cyan, green, yellow } from "jsr:@std/fmt@0.218/colors";
import { Context, Hono, Next } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import {
  prettyJSON,
  appendTrailingSlash,
} from "https://deno.land/x/hono@v4.3.11/middleware.ts";

import versions from "./versions.json" with { type: "json" };

type App = {
  Bindings: {
    remoteAddr: Deno.NetAddr;
  };
  Variables: {
    responseTime: string;
  };
};

export async function logger(context: Context, next: Next) {
  await next();
  const rt = context.var.responseTime;
  console.log(
    `${green(context.req.method)} ${yellow(context.env.remoteAddr.hostname)} ${cyan(context.req.path)} - ${bold(
      String(rt),
    )}`,
  );
}

export async function profile(context: Context, next: Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  context.set("responseTime", `${ms}ms`);
}

const app = new Hono<App>();

app.use(appendTrailingSlash());

app.use(logger);
app.use(prettyJSON());
app.use(profile);

app.get("/versions/", async (context) => {
  return context.redirect("/versions/_/", 307);
});

app.get("/versions/:package/", async (context) => {
  return context.text(context.env.remoteAddr.hostname);
});

app.notFound(function (context: Context) {
  if (context.req.path == "/") {
    return context.redirect("https://linefusion.io");
  } else {
    return context.json({
      error: "not_found",
    });
  }
});

Deno.serve(app.fetch);
