import errorMiddleware from "../middlewares/errorMiddleware";
import morganMiddleware from "../middlewares/morganMiddleware";
import api from "../routes/api";
import loadExpress from "./expressLoaders";
import { Request, Response } from "express";
export const initApp = async () => {
  const app = loadExpress();
  app.use(morganMiddleware);
  app.use("/api", api);

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // app.all("*", (req: Request, res: Response) => {
  //   res.status(404).json({
  //     error: "Route not found",
  //     path: req.originalUrl,
  //   });
  // });

  app.use(errorMiddleware);
  return app;
};
