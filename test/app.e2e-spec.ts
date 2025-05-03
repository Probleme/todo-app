import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateUserDto } from '../src/modules/users/dto/create-user.dto';
import { CreateTodoDto } from '../src/modules/todos/dto/create-todo.dto';
import * as bcrypt from 'bcryptjs';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: number;
  let todoId: number;

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
    await prismaService.$executeRaw`TRUNCATE TABLE "Todo" CASCADE`;
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up after tests
    await prismaService.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await prismaService.$executeRaw`TRUNCATE TABLE "Todo" CASCADE`;
    await app.close();
  });

  describe('Authentication', () => {
    const userDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user', () => {
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

    it('should not register a duplicate user', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send(userDto)
        .expect(400);
    });

    it('should login a user and return a token', () => {
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
  });

  describe('Todo CRUD operations', () => {
    const todoDto: CreateTodoDto = {
      title: 'Test Todo',
      description: 'E2E Test Description',
    };

    it('should create a new todo', () => {
      return request(app.getHttpServer())
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(todoDto.title);
          expect(res.body.userId).toBe(userId);
          todoId = res.body.id;
        });
    });

    it('should get all todos for the user', () => {
      return request(app.getHttpServer())
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].id).toBe(todoId);
        });
    });

    it('should get a specific todo by id', () => {
      return request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(todoId);
          expect(res.body.title).toBe(todoDto.title);
        });
    });

    it('should update a todo', () => {
      return request(app.getHttpServer())
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Todo Title' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Todo Title');
          expect(res.body.description).toBe(todoDto.description);
        });
    });

    it('should toggle todo completion status', () => {
      return request(app.getHttpServer())
        .patch(`/api/todos/${todoId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.completed).toBe(true);
        });
    });

    it('should delete a todo', () => {
      return request(app.getHttpServer())
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for deleted todo', () => {
      return request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});