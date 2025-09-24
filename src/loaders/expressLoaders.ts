import express from "express";
import cookieParser from "cookie-parser";

const loadExpress = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  return app;
};

export default loadExpress;
