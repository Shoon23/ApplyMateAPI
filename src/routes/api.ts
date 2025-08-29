import { Router } from "express";
import v1Routes from "./v1";
const api = Router();

api.use("/v1", v1Routes);

export default api;
