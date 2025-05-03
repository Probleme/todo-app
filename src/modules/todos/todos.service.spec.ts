import { Test, TestingModule } from '@nestjs/testing';
import { TodosService } from './todos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TodosService', () => {
  let service: TodosService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    todo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of todos for a user', async () => {
      const userId = 1;
      const expectedTodos = [
        {
          id: 1,
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.todo.findMany.mockResolvedValue(expectedTodos);

      const todos = await service.findAll(userId);
      expect(todos).toEqual(expectedTodos);
      expect(mockPrismaService.todo.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single todo', async () => {
      const userId = 1;
      const todoId = 1;
      const expectedTodo = {
        id: todoId,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.todo.findUnique.mockResolvedValue(expectedTodo);

      const todo = await service.findOne(userId, todoId);
      expect(todo).toEqual(expectedTodo);
      expect(mockPrismaService.todo.findUnique).toHaveBeenCalledWith({
        where: { id: todoId, userId },
      });
    });

    it('should throw an error if todo not found', async () => {
      const userId = 1;
      const todoId = 999;

      mockPrismaService.todo.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, todoId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new todo', async () => {
      const userId = 1;
      const createTodoDto = {
        title: 'New Todo',
        description: 'New Description',
      };
      const expectedTodo = {
        id: 1,
        ...createTodoDto,
        completed: false,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.todo.create.mockResolvedValue(expectedTodo);

      const todo = await service.create(userId, createTodoDto);
      expect(todo).toEqual(expectedTodo);
      expect(mockPrismaService.todo.create).toHaveBeenCalledWith({
        data: {
          ...createTodoDto,
          user: {
            connect: { id: userId },
          },
        },
      });
    });
  });
});