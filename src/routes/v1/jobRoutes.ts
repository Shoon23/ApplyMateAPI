import { Router } from "express";
import JobRepository from "../../repository/JobRepository";
import JobService from "../../services/JobService";
import JobController from "../../controllers/JobController";
import { validateReqBody } from "../../middlewares/validateReqBody";
import {
  JobApplicationID,
  JobApplicationSchema,
  JobQuerySchema,
  UpdateJobApplicationSchema,
} from "../../schema/jobSchema";
import { validateReqParam } from "../../middlewares/validateReqParam";
import { validateReqQuery } from "../../middlewares/validateReqQuery";
import LLMService from "../../services/LLMService";
import UserProfileRepostory from "../../repository/UserProfileRepository";
import config from "../../config";
const jobRoutes = Router();

const llmService = new LLMService(config.GEMINI_API_KEY as string);
const userProfileRepo = new UserProfileRepostory();

const jobRepo = new JobRepository();
const jobService = new JobService(jobRepo, userProfileRepo, llmService);
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
jobRoutes.patch(
  "/:id",
  validateReqParam(JobApplicationID),
  validateReqBody(UpdateJobApplicationSchema),
  jobController.handleUpdateJob
);

// DELETE /jobs/:id → delete a job
jobRoutes.delete(
  "/:id",
  validateReqParam(JobApplicationID),
  jobController.handleDeleteJob
);

export default jobRoutes;
