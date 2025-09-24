import { Router } from "express";
import authRoutes from "./authRoutes";
import jobRoutes from "./jobRoutes";
import userRoutes from "./userRoutes";
import { authMiddleware } from "../../middlewares/authMiddeware";
const router = Router();

router.use("/auth", authRoutes);

router.use("/jobs", authMiddleware, jobRoutes);
router.use("/profile", authMiddleware, userRoutes);
export default router;
