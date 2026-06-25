import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data.user).toHaveProperty('email');
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    beforeAll(async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email,
        password,
        firstName: 'E2E',
        lastName: 'User',
      });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
        });
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401);
    });
  });
});
