import { buildApp } from "./app.js";
import { config } from "./config.js";
const app = await buildApp();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`Listening on http://${config.HOST}:${config.PORT}`);
  if (config.HOST === "127.0.0.1" || config.HOST === "localhost")
    app.log.warn(
      "HOST đang là loopback — thiết bị thật trên LAN sẽ KHÔNG kết nối được. Đặt HOST=0.0.0.0.",
    );
} catch (err) {
  app.log.error(err);
  await app.close();
  process.exit(1);
}
