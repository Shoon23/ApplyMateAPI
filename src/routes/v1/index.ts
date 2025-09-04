import { Router } from "express";
import authRoutes from "./authRoutes";
import jobRoutes from "./jobRoutes";
import { authMiddeware } from "../../middlewares/authMiddeware";
const router = Router();

router.use("/auth", authRoutes);

router.use(authMiddeware);
router.use("/jobs", jobRoutes);

export default router;
