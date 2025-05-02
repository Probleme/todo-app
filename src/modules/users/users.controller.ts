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
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { UsersService } from './users.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { UpdatePreferencesDto } from './dto/update-preferences.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('users')
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User has been created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    create(@Body() createUserDto: CreateUserDto) {
      return this.usersService.create(createUserDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'Return all users' })
    findAll() {
      return this.usersService.findAll();
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return the user profile' })
    getProfile(@Request() req) {
      return this.usersService.findOne(req.user.id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'Return the user' })
    @ApiResponse({ status: 404, description: 'User not found' })
    findOne(@Param('id') id: string) {
      return this.usersService.findOne(+id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'User has been updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
      return this.usersService.update(req.user.id, updateUserDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch('preferences')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user preferences' })
    @ApiResponse({ status: 200, description: 'Preferences have been updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    updatePreferences(@Request() req, @Body() updatePreferencesDto: UpdatePreferencesDto) {
      return this.usersService.updatePreferences(req.user.id, updatePreferencesDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user by ID' })
    @ApiResponse({ status: 204, description: 'User has been deleted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    remove(@Param('id') id: string) {
      return this.usersService.remove(+id);
    }
  }