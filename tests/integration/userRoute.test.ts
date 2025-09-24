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
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    app = await initApp();

    const hashed = await hashPassword(testUser.password);
    await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        password: hashed,
      },
    });

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
    await prisma.userProfile.deleteMany({
      where: { user: { email: testUser.email } },
    });
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
});
