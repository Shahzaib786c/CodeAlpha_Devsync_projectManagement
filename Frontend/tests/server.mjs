// Explicit test-only server. Never used by npm start or the real backend.
import { createApplication } from "../../Backend/app.js";
import { memoryStore } from "../../Backend/tests/helpers/memoryStore.js";
if (process.env.DEVSYNC_E2E !== "1")
  throw new Error(
    "This server is for automated tests only. Set DEVSYNC_E2E=1.",
  );
let sequence = 0;
const media = {
  async upload(buffer) {
    return {
      url: `data:image/webp;base64,${buffer.toString("base64")}`,
      publicId: `test-${++sequence}`,
    };
  },
  async destroy() {},
};
const system = createApplication({
  store: memoryStore(),
  media,
  secret: "e2e-only-secret-not-for-real-deployment-123456",
  origin: "http://127.0.0.1:5173",
});
system.server.listen(5001, "127.0.0.1", () =>
  console.log(
    "DevSync E2E server: nonpersistent test storage and simulated media",
  ),
);
const stop = () => system.io.close(() => process.exit(0));
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
