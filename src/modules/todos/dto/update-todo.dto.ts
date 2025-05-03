import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTodoDto } from './create-todo.dto';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
  @ApiPropertyOptional({ example: true, description: 'Completion status of the todo' })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}