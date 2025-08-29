import errorMiddleware from "../middlewares/errorMiddleware";
import morganMiddleware from "../middlewares/morganMiddleware";
import api from "../routes/api";
import loadExpress from "./expressLoaders";

export const initApp = async () => {
  const app = loadExpress();
  app.use(morganMiddleware);
  app.use("/api", api);

  app.use(errorMiddleware);
  return app;
};
