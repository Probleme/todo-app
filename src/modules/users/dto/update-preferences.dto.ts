import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({
    example: { theme: 'dark', notifications: true },
    description: 'User preferences as a JSON object',
  })
  @IsObject()
  preferences: Record<string, any>;
}