import request from "supertest";
import { Express } from "express";
import prisma from "../../src/prisma";
import { initApp } from "../../src/loaders";
import { hashPassword } from "../../src/utils/hashPassword";

describe("Job Route Integration", () => {
  let app: Express;
  const testUser = {
    email: "jobtest@example.com",
    name: "Job Tester",
    password: "secret123",
  };
  let accessToken: string;

  beforeAll(async () => {
    // Clean up in case
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    app = await initApp();

    // Create user
    const hashed = await hashPassword(testUser.password);
    await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        password: hashed,
      },
    });

    // Login to get token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.jobApplication.deleteMany({
      where: { user: { email: testUser.email } },
    });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  describe("POST /api/v1/jobs", () => {
    const url = "/api/v1/jobs";
    const jobData = {
      company: "OpenAI",
      position: "Backend Engineer",
      source: "LinkedIn",
      status: "APPLIED",
      appliedDate: new Date().toISOString(),
      deadline: null,
      contactName: "Alice",
      contactEmail: "alice@example.com",
    };

    it("should create a job successfully", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(jobData)
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.company).toBe(jobData.company);
      expect(res.body.position).toBe(jobData.position);
      expect(res.body.source).toBe(jobData.source);
      expect(res.body.status).toBe(jobData.status);
      expect(res.body.contactName).toBe(jobData.contactName);
      expect(res.body.contactEmail).toBe(jobData.contactEmail);

      // Check DB
      const jobInDb = await prisma.jobApplication.findUnique({
        where: { id: res.body.id },
      });
      expect(jobInDb).not.toBeNull();
      expect(jobInDb?.company).toBe(jobData.company);
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.errors)).toBe(true);

      const props = res.body.errors.map((err: any) => err.property);
      expect(props).toContain("company");
      expect(props).toContain("position");
      expect(props).toContain("status");
    });

    it("should return 401 if no token provided", async () => {
      await request(app).post(url).send(jobData).expect(401);
    });

    it("should return 401 for invalid token", async () => {
      await request(app)
        .post(url)
        .set("Authorization", "Bearer invalid.token")
        .send(jobData)
        .expect(401);
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ...jobData, contactEmail: "not-an-email" })
        .expect(400);

      const emailError = res.body.errors.find(
        (e: any) => e.property === "contactEmail"
      );
      expect(emailError).toBeDefined();
      expect(emailError.message).toMatch(/invalid contact email/i);
    });

    it("should return 400 for too short company name", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ...jobData, company: "A" })
        .expect(400);

      const companyError = res.body.errors.find(
        (e: any) => e.property === "company"
      );
      expect(companyError).toBeDefined();
      expect(companyError.message).toMatch(/at least 2 characters/i);
    });

    it("should return 400 for invalid status", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ...jobData, status: "INVALID_STATUS" })
        .expect(400);

      const statusError = res.body.errors.find(
        (e: any) => e.property === "status"
      );
      expect(statusError).toBeDefined();
      expect(statusError.message).toMatch(/status must be one of/i);
    });

    it("should return 400 for invalid appliedDate", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ...jobData, appliedDate: "not-a-date" })
        .expect(400);

      const dateError = res.body.errors.find(
        (e: any) => e.property === "appliedDate"
      );
      expect(dateError).toBeDefined();
      expect(dateError.message).toMatch(/must be a valid date/i);
    });

    it("should allow null optional fields", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...jobData,
          source: null,
          contactName: "",
          contactEmail: "",
        })
        .expect(201);

      expect(res.body.source).toBeNull();
      expect(res.body.contactName).toBe("");
      expect(res.body.contactEmail).toBe("");
    });

    it("should persist job with correct userId", async () => {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(jobData)
        .expect(201);

      const jobInDb = await prisma.jobApplication.findUnique({
        where: { id: res.body.id },
        include: { user: true },
      });

      expect(jobInDb?.user.email).toBe(testUser.email);
    });
  });
});
