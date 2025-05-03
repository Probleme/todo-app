import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('todos')
@Controller('todos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo has been created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Request() req, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(req.user.id, createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Return filtered todo list with pagination' })
  findAll(@Request() req, @Query() queryDto: QueryTodoDto = {}) {
    // Added default empty object for queryDto
    return this.todosService.findAll(req.user.id, queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get todo statistics' })
  @ApiResponse({ status: 200, description: 'Return todo statistics' })
  getStatistics(@Request() req) {
    return this.todosService.getStatistics(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo by ID' })
  @ApiResponse({ status: 200, description: 'Return the todo' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.todosService.findOne(req.user.id, +id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update todo by ID' })
  @ApiResponse({ status: 200, description: 'Todo has been updated successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(req.user.id, +id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete todo by ID' })
  @ApiResponse({ status: 204, description: 'Todo has been deleted successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.todosService.remove(req.user.id, +id);
  }
}