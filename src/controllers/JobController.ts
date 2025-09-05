import JobRepository from "../repository/JobRepository";
import { Request, Response } from "express";
import JobService from "../services/JobService";
import { AuthRequest } from "../types/auth";
import AuthError from "../errors/AuthError";
class JobController {
  constructor(private jobService: JobService) {}

  handleCreateJob = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthError({
        message: "Authentication Failed",
        property: "token",
      });
    }
    const jobData = await this.jobService.createJobApplication({
      ...req.body,
      userId: req.user.userId,
    });
    return res.status(201).json(jobData);
  };

  handleGetJob = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthError({
        message: "Authentication Failed",
        property: "token",
      });
    }

    const jobData = await this.jobService.getJobById(
      req.params.id,
      req.user.userId
    );

    return res.status(200).json(jobData);
  };
}

export default JobController;
