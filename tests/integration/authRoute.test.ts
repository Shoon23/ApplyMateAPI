import bcrypt from "bcryptjs";
import prisma from "../../src/prisma";
import { initApp } from "../../src/loaders/index";
import request from "supertest";
import { Express } from "express";
import { hashPassword } from "../../src/utils/hashPassword";
describe("Auth Integration", () => {
  const testUser = {
    email: "integration@example.com",
    name: "Integration Tester",
    password: "secret123",
  };
  let app: Express;
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
  });
  afterAll(async () => {
    // Cleanup after tests
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });
  describe("POST /api/v1/auth/login", () => {
    const url = "/api/v1/auth/login";
    it("should return 200 and tokens with valid credentials", async () => {
      const res = await request(app)
        .post(url)
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
    });

    it("should return 401 for invalid password", async () => {
      const res = await request(app)
        .post(url)
        .send({
          email: testUser.email,
          password: "wrongPassword",
        })
        .expect(401);

      expect(res.body.errorType).toBe("AUTH_ERROR");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors[0]).toHaveProperty("message");
      expect(res.body.errors[0].message).toMatch(/Wrong Password/i);
      expect(res.body.errors[0].property).toBe("password");
    });

    it("should return 404 if user does not exist", async () => {
      const res = await request(app)
        .post(url)
        .send({
          email: "nonexistent@example.com",
          password: "whatever",
        })
        .expect(401);

      expect(res.body.errorType).toBe("AUTH_ERROR");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors[0]).toHaveProperty("message");
      expect(res.body.errors[0].property).toBe("email");
      expect(res.body.errors[0].message).toMatch(/User is not yet Registered/i);
    });

    it("should return 400 for missing fields", async () => {
      const res = await request(app).post(url).send({}).expect(400);

      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.errors)).toBe(true);

      const props = res.body.errors.map((err: any) => err.property);

      expect(props).toContain("email");
      expect(props).toContain("password");

      const emailError = res.body.errors.find(
        (err: any) => err.property === "email"
      );
      const passwordError = res.body.errors.find(
        (err: any) => err.property === "password"
      );

      expect(emailError.message).toMatch(/email/i);
      expect(passwordError.message).toMatch(/password/i);
    });
    it("should return 400 for invalid email format", async () => {
      const res = await request(app)
        .post(url)
        .send({
          email: "not-an-email",
          password: "somepassword123",
        })
        .expect(400);

      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.errors)).toBe(true);

      const emailError = res.body.errors.find(
        (err: any) => err.property === "email"
      );
      expect(emailError).toBeDefined();
      expect(emailError.message).toMatch(/invalid email/i);
    });
  });
  describe("POST /api/v1/auth/register", () => {
    const url = "/api/v1/auth/register";
    const newUser = {
      email: "newuser@example.com",
      name: "New User",
      password: "password123",
    };

    afterEach(async () => {
      // Clean up only the newUser if created
      await prisma.user.deleteMany({ where: { email: newUser.email } });
    });

    it("should return 201 and user data (without password) when registration succeeds", async () => {
      const res = await request(app).post(url).send(newUser).expect(201);

      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user.name).toBe(newUser.name);
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should return 400 if fields are missing", async () => {
      const res = await request(app).post(url).send({}).expect(400);

      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.errors)).toBe(true);

      const props = res.body.errors.map((err: any) => err.property);
      expect(props).toContain("email");
      expect(props).toContain("name");
      expect(props).toContain("password");
    });

    it("should return 400 if email format is invalid", async () => {
      const res = await request(app)
        .post(url)
        .send({
          ...newUser,
          email: "invalid-email",
        })
        .expect(400);

      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      const emailError = res.body.errors.find(
        (err: any) => err.property === "email"
      );
      expect(emailError).toBeDefined();
      expect(emailError.message).toMatch(/invalid email/i);
    });

    it("should return 400 if password is too short", async () => {
      const res = await request(app)
        .post(url)
        .send({
          ...newUser,
          password: "123",
        })
        .expect(400);

      expect(res.body.errorType).toBe("VALIDATION_ERROR");
      const passwordError = res.body.errors.find(
        (err: any) => err.property === "password"
      );
      expect(passwordError).toBeDefined();
      expect(passwordError.message).toMatch(/at least 6 characters/i);
    });

    it("should return 409 if email is already registered", async () => {
      // Create the user first
      const hashed = await hashPassword(newUser.password);
      await prisma.user.create({
        data: { ...newUser, password: hashed },
      });

      const res = await request(app).post(url).send(newUser).expect(401);

      expect(res.body.errorType).toBe("AUTH_ERROR");
      const emailError = res.body.errors.find(
        (err: any) => err.property === "email"
      );
      expect(emailError).toBeDefined();
      expect(emailError.message).toMatch(/already registered/i);
    });
  });
});
