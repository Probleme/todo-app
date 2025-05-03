import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsDateString, 
  IsArray
} from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateTodoDto {
  @ApiProperty({ example: 'Complete project', description: 'Title of the todo' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Finish the backend implementation', description: 'Description of the todo' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2023-12-31T23:59:59Z', description: 'Due date of the todo' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ 
    enum: Priority, 
    default: Priority.MEDIUM,
    example: Priority.HIGH,
    description: 'Priority level of the todo'
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ 
    type: [String], 
    example: ['work', 'urgent'],
    description: 'Tags associated with the todo'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}