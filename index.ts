import { Application } from "https://deno.land/x/oak/mod.ts";
import send from './presentation/lib/send.ts';

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(async (ctx) => {
    const path = `./presentation${ctx.request.url.pathname}`;
    console.log(path);
    const stats = await Deno.stat(path) || {};
    ctx.response.headers.set("Content-Length", String(stats.size));
    ctx.response.headers.set("Cache-Control", "max-age=10");
    if (stats.mtime) {
      ctx.response.headers.set("Last-Modified", stats.mtime.toUTCString());
    }

    ctx.response.body = await Deno.readFile(path);
    send(ctx.request, ctx.response);
});

await app.listen({ port: 8000 });