import { Router } from "express";
import JobRepository from "../../repository/JobRepository";
import JobService from "../../services/JobService";
import JobController from "../../controllers/JobController";
import { validateReqBody } from "../../middlewares/validateReqBody";
import {
  JobApplicationID,
  JobApplicationSchema,
  JobQuerySchema,
} from "../../schema/jobSchema";
import { validateReqParam } from "../../middlewares/validateReqParam";
import { validateReqQuery } from "../../middlewares/validateReqQuery";

const jobRoutes = Router();

const jobRepo = new JobRepository();
const jobService = new JobService(jobRepo);
const jobController = new JobController(jobService);
// GET /jobs → list all jobs
jobRoutes.get(
  "/",
  validateReqQuery(JobQuerySchema),
  jobController.handleGetJobs
);

// GET /jobs/:id → get one job by id
jobRoutes.get(
  "/:id",
  validateReqParam(JobApplicationID),
  jobController.handleGetJob
);

// POST /jobs → create a job
jobRoutes.post(
  "/",
  validateReqBody(JobApplicationSchema),
  jobController.handleCreateJob
);

// PUT /jobs/:id → update a job
jobRoutes.put("/:id", (req, res) => {});

// DELETE /jobs/:id → delete a job
jobRoutes.delete("/:id", (req, res) => {});

export default jobRoutes;
