import path from "path";
import fs from "fs";
import request from "supertest";
import { Express } from "express";
import prisma from "../../src/prisma";
import { initApp } from "../../src/loaders";
import { hashPassword } from "../../src/utils/hashPassword";

describe("User Route Integration", () => {
  let app: Express;
  const testUser = {
    email: "jobtest@example.com",
    name: "Job Tester",
    password: "secret123",
  };
  let accessToken: string;

  beforeAll(async () => {
    // Delete any existing test data manually in correct order
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { profile: true },
    });

    if (existingUser?.profile) {
      const profileId = existingUser.profile.id;

      // Delete all related child records first
      await prisma.contact.deleteMany({ where: { profileId } });
      await prisma.skill.deleteMany({ where: { profileId } });
      await prisma.experience.deleteMany({ where: { profileId } });
      await prisma.education.deleteMany({ where: { profileId } });

      // Delete the profile itself
      await prisma.userProfile.delete({ where: { id: profileId } });
    }

    // Delete the user
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    // Now create fresh test user
    const hashed = await hashPassword(testUser.password);
    await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        password: hashed,
      },
    });

    // Initialize app and login
    app = await initApp();
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);
    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // Repeat same deletion process for cleanup
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { profile: true },
    });

    if (existingUser?.profile) {
      const profileId = existingUser.profile.id;
      await prisma.contact.deleteMany({ where: { profileId } });
      await prisma.skill.deleteMany({ where: { profileId } });
      await prisma.experience.deleteMany({ where: { profileId } });
      await prisma.education.deleteMany({ where: { profileId } });
      await prisma.userProfile.delete({ where: { id: profileId } });
    }

    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  describe("POST /api/v1/profile", () => {
    const pdfPath = path.join(__dirname, "../fixtures/jh-resume.pdf");

    it("should create a new profile when a valid PDF is uploaded", async () => {
      const res = await request(app)
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", pdfPath)
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("userId");
      expect(res.body.contact).toBeDefined();
    });

    it("should not allow duplicate profiles", async () => {
      // Second upload should fail
      const res = await request(app)
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", pdfPath)
        .expect(409);

      expect(res.body.errorType).toBe("DUPLICATE_ERROR");
      expect(res.body.errors[0].message).toMatch(/already exists/i);
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app).post("/api/v1/profile").expect(401);

      expect(res.body.errorType).toBe("AUTH_ERROR");
      expect(res.body.errors[0].message).toMatch(/No token provided/i);
    });

    it("should return 400 if no file is uploaded", async () => {
      const res = await request(app)
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400);
      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      expect(res.body.errors[0].message).toMatch(/No File Upload/i);
    });
  });

  describe("GET /api/v1/profile", () => {
    it("should return a user profile", async () => {
      const res = await request(app)
        .get("/api/v1/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("userId");
      expect(res.body).toBeDefined();
    });
    it("should return 401 if no access token is provided", async () => {
      const res = await request(app).get("/api/v1/profile").expect(401);

      expect(res.body).toHaveProperty("errorType");
      expect(res.body.errorType).toMatch(/AUTH_ERROR/i);
    });
    it("should return 401 if access token ics invalid", async () => {
      const res = await request(app)
        .get("/api/v1/profile")
        .set("Authorization", "Bearer invalidtoken123")
        .expect(401);

      expect(res.body).toHaveProperty("errorType");
      expect(res.body.errorType).toMatch(/AUTH_ERROR/i);
    });
  });
});
