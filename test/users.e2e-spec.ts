import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateUserDto } from '../src/modules/users/dto/create-user.dto';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api');
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Clean database before tests
    await prismaService.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up after tests
    await prismaService.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await app.close();
  });

  const userDto: CreateUserDto = {
    email: 'e2e-test@example.com',
    password: 'password123',
    firstName: 'E2E',
    lastName: 'Test',
  };

  it('should register a user', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send(userDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe(userDto.email);
        userId = res.body.id;
      });
  });

  it('should login a user', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userDto.email,
        password: userDto.password,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        authToken = res.body.accessToken;
      });
  });

  it('should get user profile', () => {
    return request(app.getHttpServer())
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(userId);
        expect(res.body.email).toBe(userDto.email);
      });
  });

  it('should update user profile', () => {
    return request(app.getHttpServer())
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'Name',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.firstName).toBe('Updated');
        expect(res.body.lastName).toBe('Name');
      });
  });

  it('should update user preferences', () => {
    return request(app.getHttpServer())
      .patch('/api/users/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
        },
        language: 'en',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.preferences.theme).toBe('dark');
        expect(res.body.preferences.language).toBe('en');
      });
  });
});