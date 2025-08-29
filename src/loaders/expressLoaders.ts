import express from "express";
const loadExpress = () => {
  const app = express();
  app.use(express.json());

  return app;
};

export default loadExpress;
