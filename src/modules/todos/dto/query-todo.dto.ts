import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsString, 
  IsInt, 
  Min, 
  Max,
  IsIn
} from 'class-validator';
import { Priority } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class QueryTodoDto {
  @ApiPropertyOptional({ 
    enum: Priority, 
    description: 'Filter by priority'
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ 
    example: 'project', 
    description: 'Search in title and description'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    example: 'work', 
    description: 'Filter by tag'
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    enum: ['title', 'dueDate', 'createdAt', 'priority'],
    default: 'createdAt',
    description: 'Field to sort by'
  })
  @IsOptional()
  @IsString()
  @IsIn(['title', 'dueDate', 'createdAt', 'priority'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort order'
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ 
    default: 1, 
    minimum: 1,
    description: 'Page number for pagination'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    default: 10, 
    minimum: 1, 
    maximum: 100,
    description: 'Number of items per page'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}