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
  let otherUser: any;
  let otherJob: any;
  beforeAll(async () => {
    // Clean up in case
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.user.deleteMany({ where: { email: "other@example.com" } });

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
    otherUser = await prisma.user.create({
      data: {
        email: "other@example.com",
        name: "Other User",
        password: await hashPassword("password"),
      },
    });
    otherJob = await prisma.jobApplication.create({
      data: {
        company: "Google",
        position: "Frontend Engineer",
        status: "APPLIED",
        appliedDate: new Date(),
        userId: otherUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.jobApplication.deleteMany({
      where: {
        OR: [
          { user: { email: testUser.email } },
          { user: { email: "other@example.com" } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [testUser.email, "other@example.com"] } },
    });
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
          source: "",
          contactName: "",
          contactEmail: "",
        })
        .expect(201);
      expect(res.body.source).toBeNull();
      expect(res.body.contactName).toBeNull();
      expect(res.body.contactEmail).toBeNull();
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

  describe("GET /api/v1/jobs/:id", () => {
    let createdJobId: string;

    beforeAll(async () => {
      // Create a job first so we can fetch it
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "OpenAI",
          position: "Backend Engineer",
          source: "LinkedIn",
          status: "APPLIED",
          appliedDate: new Date().toISOString(),
          deadline: null,
          contactName: "Alice",
          contactEmail: "alice@example.com",
        })
        .expect(201);

      createdJobId = jobRes.body.id;
    });

    it("should return a job successfully", async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("id", createdJobId);
      expect(res.body.company).toBe("OpenAI");
      expect(res.body.position).toBe("Backend Engineer");
    });

    it("should return 404 if job not found", async () => {
      const res = await request(app)
        .get("/api/v1/jobs/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);

      expect(res.body.errorType).toBe("NOT_FOUND");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors[0].message).toMatch(/not found/i);
    });

    it("should return 401 if no token provided", async () => {
      await request(app).get(`/api/v1/jobs/${createdJobId}`).expect(401);
    });

    it("should return 401 for invalid token", async () => {
      await request(app)
        .get(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", "Bearer invalid.token")
        .expect(401);
    });
    it("should return only jobs that belong to the user", async () => {
      // Our test user should NOT be able to fetch it
      const res = await request(app)
        .get(`/api/v1/jobs/${otherJob.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404); // should behave as "not found" for unauthorized access

      expect(res.body.errorType).toBe("NOT_FOUND");
    });
  });
  describe("GET /api/v1/jobs", () => {
    beforeAll(async () => {
      const jobs = [
        { company: "Apple", position: "iOS Dev", status: "APPLIED" },
        { company: "Microsoft", position: "Backend Dev", status: "INTERVIEW" },
        { company: "Google", position: "Frontend Dev", status: "WISHLIST" },
        { company: "Amazon", position: "DevOps", status: "OFFER" },
        { company: "Facebook", position: "Fullstack", status: "HIRED" },
        { company: "Netflix", position: "Backend", status: "REJECTED" },
      ];

      for (const job of jobs) {
        await request(app)
          .post("/api/v1/jobs")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            ...job,
            appliedDate: new Date().toISOString(),
            deadline: null,
            contactName: "Alice",
            contactEmail: "alice@example.com",
          });
      }
    });

    it("should return paginated jobs", async () => {
      const res = await request(app)
        .get("/api/v1/jobs?limit=2&page=1")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    });

    it("should filter jobs by search query", async () => {
      const res = await request(app)
        .get("/api/v1/jobs?search=Apple")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].company).toBe("Apple");
    });

    const STATUS_ORDER = [
      "WISHLIST",
      "APPLIED",
      "INTERVIEW",
      "OFFER",
      "HIRED",
      "REJECTED",
    ];

    it("should return 401 if no token provided", async () => {
      await request(app).get("/api/v1/jobs").expect(401);
    });

    it("should return 401 for invalid token", async () => {
      await request(app)
        .get("/api/v1/jobs")
        .set("Authorization", "Bearer invalid.token")
        .expect(401);
    });
    describe("GET /api/v1/jobs sorting by all statuses", () => {
      const STATUS_ORDER = [
        "WISHLIST",
        "APPLIED",
        "INTERVIEW",
        "OFFER",
        "HIRED",
        "REJECTED",
      ];

      for (const sortBy of STATUS_ORDER) {
        for (const order of ["asc", "desc"] as const) {
          it(`should sort jobs by ${sortBy} in ${order} order`, async () => {
            const res = await request(app)
              .get(`/api/v1/jobs?sortBy=${sortBy}&order=${order}`)
              .set("Authorization", `Bearer ${accessToken}`)
              .expect(200);

            const statuses = res.body.data.map((j: any) => j.status);
            const sortedStatuses = [...statuses].sort((a, b) =>
              order === "asc"
                ? STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b)
                : STATUS_ORDER.indexOf(b) - STATUS_ORDER.indexOf(a)
            );
            expect(statuses).toEqual(sortedStatuses);
          });
        }
      }
    });
  });

  describe("PATCH /api/v1/jobs/:id", () => {
    let createdJobId: string;

    beforeAll(async () => {
      // Create a job first so we can update it
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "Tesla",
          position: "Software Engineer",
          status: "APPLIED",
          appliedDate: new Date().toISOString(),
          deadline: null,
          contactName: "Alice",
          contactEmail: "alice@example.com",
        })
        .expect(201);

      createdJobId = jobRes.body.id;
    });
    afterAll(async () => {
      // Clean up this specific job
      if (createdJobId) {
        await prisma.jobApplication.deleteMany({
          where: { id: createdJobId },
        });
      }
    });
    it("should update a job successfully", async () => {
      const updateData = { company: "SpaceX" };

      const res = await request(app)
        .patch(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("id", createdJobId);
      expect(res.body.company).toBe("SpaceX");

      // Verify in DB
      const jobInDb = await prisma.jobApplication.findUnique({
        where: { id: createdJobId },
      });
      expect(jobInDb?.company).toBe("SpaceX");
    });

    it("should return 404 if job not found", async () => {
      const res = await request(app)
        .patch("/api/v1/jobs/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ company: "Meta" })
        .expect(404);

      expect(res.body.errorType).toBe("NOT_FOUND");
      expect(res.body.errors[0].message).toMatch(/not found/i);
    });

    it("should return 400 for invalid input", async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ contactEmail: "not-an-email" })
        .expect(400);

      const emailError = res.body.errors.find(
        (e: any) => e.property === "contactEmail"
      );
      expect(emailError).toBeDefined();
      expect(emailError.message).toMatch(/invalid contact email/i);
    });

    it("should return 401 if no token provided", async () => {
      await request(app)
        .patch(`/api/v1/jobs/${createdJobId}`)
        .send({ company: "Unauthorized" })
        .expect(401);
    });

    it("should return 401 for invalid token", async () => {
      await request(app)
        .patch(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", "Bearer invalid.token")
        .send({ company: "Invalid" })
        .expect(401);
    });

    it("should not allow updating another user's job", async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${otherJob.id}`) // job owned by otherUser
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ company: "Hacker Updated" })
        .expect(404); // should behave like not found

      expect(res.body.errorType).toBe("NOT_FOUND");

      // Confirm DB not modified
      const jobInDb = await prisma.jobApplication.findUnique({
        where: { id: otherJob.id },
      });
      expect(jobInDb?.company).toBe("Google"); // original value
    });
  });

  describe("DELETE /api/v1/jobs/:id", () => {
    let createdJobId: string;

    beforeAll(async () => {
      // Create a job owned by testUser
      const jobRes = await request(app)
        .post("/api/v1/jobs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          company: "DeleteMe Inc",
          position: "QA Engineer",
          status: "APPLIED",
          appliedDate: new Date().toISOString(),
          deadline: null,
          contactName: "Alice",
          contactEmail: "alice@example.com",
        })
        .expect(201);

      createdJobId = jobRes.body.id;
    });
    afterAll(async () => {
      // Clean up this specific job
      if (createdJobId) {
        await prisma.jobApplication.deleteMany({
          where: { id: createdJobId },
        });
      }
    });
    it("should delete a job successfully", async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.data).toHaveProperty("id", createdJobId);

      // Verify it's gone from DB
      const jobInDb = await prisma.jobApplication.findUnique({
        where: { id: createdJobId },
      });
      expect(jobInDb).toBeNull();
    });

    it("should return 404 if job not found", async () => {
      const res = await request(app)
        .delete("/api/v1/jobs/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);

      expect(res.body.errorType).toBe("NOT_FOUND");
      expect(res.body.errors[0].message).toMatch(/not found/i);
    });

    it("should not allow deleting another user's job", async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${otherJob.id}`) // belongs to otherUser
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404); // should behave like not found

      expect(res.body.errorType).toBe("NOT_FOUND");

      // Ensure it's still in DB
      const jobInDb = await prisma.jobApplication.findUnique({
        where: { id: otherJob.id },
      });
      expect(jobInDb).not.toBeNull();
      expect(jobInDb?.company).toBe("Google");
    });

    it("should return 401 if no token provided", async () => {
      await request(app).delete(`/api/v1/jobs/${createdJobId}`).expect(401);
    });

    it("should return 401 for invalid token", async () => {
      await request(app)
        .delete(`/api/v1/jobs/${createdJobId}`)
        .set("Authorization", "Bearer invalid.token")
        .expect(401);
    });
  });
});
