import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { Priority, Prisma } from '@prisma/client';

@Injectable()
export class TodosService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: number, createTodoDto: CreateTodoDto) {
    try {
      const todo = await this.prisma.todo.create({
        data: {
          ...createTodoDto,
          userId,
        },
      });

      // Invalidate cache for user todos
      await this.invalidateUserTodosCache(userId);

      return todo;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Invalid todo data');
      }
      throw error;
    }
  }

  async findAll(userId: number, queryDto: QueryTodoDto) {
    const { 
      isCompleted, 
      priority, 
      search, 
      tag, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = queryDto;

    const cacheKey = `todos:${userId}:${JSON.stringify(queryDto)}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // Build filter conditions
    const where: Prisma.TodoWhereInput = { userId };
    
    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (tag) {
      where.tags = { has: tag };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute count query for total
    const total = await this.prisma.todo.count({ where });

    // Execute main query with filters, sorting, and pagination
    const todos = await this.prisma.todo.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const result = {
      data: todos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async findOne(userId: number, id: number) {
    const cacheKey = `todo:${id}`;
    const cachedTodo = await this.cacheManager.get(cacheKey);
    
    if (cachedTodo) {
      return cachedTodo;
    }

    const todo = await this.prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    if (todo.userId !== userId) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Cache the todo for 5 minutes
    await this.cacheManager.set(cacheKey, todo, 300000);

    return todo;
  }

  async update(userId: number, id: number, updateTodoDto: UpdateTodoDto) {
    await this.findOne(userId, id);

    try {
      const updatedTodo = await this.prisma.todo.update({
        where: { id },
        data: updateTodoDto,
      });

      // Invalidate caches
      await this.invalidateTodoCache(id);
      await this.invalidateUserTodosCache(userId);

      return updatedTodo;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Invalid todo data');
      }
      throw error;
    }
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);

    const deletedTodo = await this.prisma.todo.delete({
      where: { id },
    });

    // Invalidate caches
    await this.invalidateTodoCache(id);
    await this.invalidateUserTodosCache(userId);

    return deletedTodo;
  }

  async getStatistics(userId: number) {
    const cacheKey = `todo:stats:${userId}`;
    const cachedStats = await this.cacheManager.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }

    const totalCount = await this.prisma.todo.count({
      where: { userId },
    });

    const completedCount = await this.prisma.todo.count({
      where: {
        userId,
        isCompleted: true,
      },
    });

    const pendingCount = totalCount - completedCount;

    const priorityCounts = await this.prisma.todo.groupBy({
      by: ['priority'],
      where: { userId },
      _count: {
        priority: true,
      },
    });

    const priorityStats = {
      [Priority.LOW]: 0,
      [Priority.MEDIUM]: 0,
      [Priority.HIGH]: 0,
    };

    priorityCounts.forEach((item) => {
      priorityStats[item.priority] = item._count.priority;
    });

    const stats = {
      total: totalCount,
      completed: completedCount,
      pending: pendingCount,
      completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      byPriority: priorityStats,
    };

    // Cache the statistics for 10 minutes
    await this.cacheManager.set(cacheKey, stats, 600000);

    return stats;
  }

  private async invalidateTodoCache(id: number) {
    await this.cacheManager.del(`todo:${id}`);
  }

  private async invalidateUserTodosCache(userId: number) {
    // In a real Redis implementation, you would use pattern matching to delete all related keys
    // For this implementation, we'll just delete the statistics cache
    await this.cacheManager.del(`todo:stats:${userId}`);
  }
}