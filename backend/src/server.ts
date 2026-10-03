import { buildApp } from "./app.js";
import { config } from "./config.js";
const app = await buildApp();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
try {
  await app.listen({ port: config.PORT, host: config.HOST });
} catch (err) {
  app.log.error(err);
  await app.close();
  process.exit(1);
}
