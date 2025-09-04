import { initApp } from "./loaders";
import logger from "./utils/logger";
import config from "./config";
const start = async () => {
  const app = await initApp();
  const PORT = process.env.PORT || 8080;

  app.listen(PORT, () => {
    logger.info(`🚀 Server started on http://localhost:${PORT}`);
  });
};

start();
