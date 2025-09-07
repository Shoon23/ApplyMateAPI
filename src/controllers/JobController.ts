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
  handleGetJobs = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthError({
        message: "Authentication Failed",
        property: "token",
      });
    }

    const { limit, page, skip } = this.getPagination(req);
    const filters = {
      search: (req.query.search as string) || "",
      sortBy: (req.query.sortBy as string) || "APPLIED",
      order: (req.query.order as string) || "desc",
    };

    const jobsdata = await this.jobService.getJobs({
      filters,
      limit,
      page,
      skip,
      userId: req.user.userId,
    });
    res.status(200).json(jobsdata);
  };
}

export default JobController;
