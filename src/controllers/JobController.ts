import JobRepository from "../repository/JobRepository";
import { Request, Response } from "express";
import JobService from "../services/JobService";
import { AuthRequest } from "../types/auth";
import AuthError from "../errors/AuthError";
import BaseController from "./BaseController";
class JobController extends BaseController {
  constructor(private jobService: JobService) {
    super();
  }

  handleCreateJob = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);

    const jobData = await this.jobService.createJobApplication({
      ...req.body,
      userId: user.userId,
    });
    return res.status(201).json(jobData);
  };

  handleGetJob = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);

    const jobData = await this.jobService.getJobById(
      req.params.id,
      user.userId
    );

    return res.status(200).json(jobData);
  };
  handleGetJobs = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);

    const jobsdata = await this.jobService.getJobs({
      userId: user.userId,
      query: req.query,
      pagination: this.getPagination(req),
    });
    res.status(200).json(jobsdata);
  };

  handleUpdateJob = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);
    const jobId = req.params.id;
    const updatedJob = await this.jobService.updateJob({
      ...req.body,
      id: jobId,
      userId: user.userId,
    });

    res.status(200).json(updatedJob);
  };

  handleDeleteJob = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);
    const jobId = req.params.id;

    const deletedJob = await this.jobService.deleteJob(jobId, user.userId);

    res.status(200).json({
      message: "Job Delete Successfully",
      data: deletedJob,
    });
  };
}

export default JobController;
