import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

describe('TodosController', () => {
  let controller: TodosController;
  let service: TodosService;

  const mockTodosService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleComplete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: TodosService,
          useValue: mockTodosService,
        },
      ],
    }).compile();

    controller = module.get<TodosController>(TodosController);
    service = module.get<TodosService>(TodosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all todos for the user', async () => {
      const userId = 1;
      const expectedTodos = [
        {
          id: 1,
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          userId,
        },
      ];

      mockTodosService.findAll.mockResolvedValue(expectedTodos);

      const mockReq = { user: { id: userId } };
      const result = await controller.findAll(mockReq);

      expect(result).toBe(expectedTodos);
      expect(mockTodosService.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should create a new todo', async () => {
      const userId = 1;
      const createTodoDto: CreateTodoDto = {
        title: 'New Todo',
        description: 'New Description',
      };
      const expectedTodo = {
        id: 1,
        ...createTodoDto,
        completed: false,
        userId,
      };

      mockTodosService.create.mockResolvedValue(expectedTodo);

      const mockReq = { user: { id: userId } };
      const result = await controller.create(mockReq, createTodoDto);

      expect(result).toBe(expectedTodo);
      expect(mockTodosService.create).toHaveBeenCalledWith(userId, createTodoDto);
    });
  });
});