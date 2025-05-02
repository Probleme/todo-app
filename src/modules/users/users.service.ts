import { 
    Injectable, 
    NotFoundException,
    ConflictException,
    BadRequestException,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { UpdatePreferencesDto } from './dto/update-preferences.dto';
  import * as bcrypt from 'bcryptjs';
  import { Prisma } from '@prisma/client';
  
  @Injectable()
  export class UsersService {
    constructor(private prisma: PrismaService) {}
  
    async create(createUserDto: CreateUserDto) {
      const { email, password, firstName, lastName } = createUserDto;
  
      try {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });
  
        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
  
        // Hash password
        const hashedPassword = await this.hashPassword(password);
  
        // Create new user
        const newUser = await this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            isActive: true,
          },
        });
  
        return newUser;
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Handle Prisma specific errors
          if (error.code === 'P2002') {
            throw new ConflictException('Email already exists');
          }
        }
        
        throw new InternalServerErrorException('Error creating user');
      }
    }
  
    async findAll() {
      try {
        return this.prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            isActive: true,
          },
        });
      } catch (error) {
        throw new InternalServerErrorException('Error retrieving users');
      }
    }
  
    async findOne(id: number) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            isActive: true,
            preferences: true,
          },
        });
  
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
  
        return user;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException(`Error retrieving user with ID ${id}`);
      }
    }
  
    async findByEmail(email: string) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { email },
        });
        
        return user;
      } catch (error) {
        throw new InternalServerErrorException(`Error finding user by email`);
      }
    }
  
    async update(id: number, updateUserDto: UpdateUserDto) {
      try {
        // Check if user exists
        await this.findOne(id);
  
        const updateData: any = { ...updateUserDto };
        
        // If password is being updated, hash it
        if (updateUserDto.password) {
          updateData.password = await this.hashPassword(updateUserDto.password);
        }
  
        // Update user
        const updatedUser = await this.prisma.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
            isActive: true,
          },
        });
  
        return updatedUser;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException(`Error updating user with ID ${id}`);
      }
    }
  
    async updatePreferences(id: number, updatePreferencesDto: UpdatePreferencesDto) {
      try {
        // Check if user exists
        await this.findOne(id);
  
        return this.prisma.user.update({
          where: { id },
          data: {
            preferences: updatePreferencesDto.preferences,
          },
          select: {
            id: true,
            preferences: true,
          },
        });
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException(`Error updating preferences for user with ID ${id}`);
      }
    }
  
    async remove(id: number) {
      try {
        // Check if user exists
        await this.findOne(id);
  
        // Delete user
        await this.prisma.user.delete({
          where: { id },
        });
  
        return { message: `User with ID ${id} has been deleted` };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException(`Error deleting user with ID ${id}`);
      }
    }
  
    async setRefreshToken(userId: number, refreshToken: string | null) {
      try {
        let data: any = {};
        
        if (refreshToken) {
          const hashedToken = await this.hashPassword(refreshToken);
          data = { refreshToken: hashedToken };
        } else {
          data = { refreshToken: null };
        }
  
        return this.prisma.user.update({
          where: { id: userId },
          data,
        });
      } catch (error) {
        throw new InternalServerErrorException('Error setting refresh token');
      }
    }
  
    async validateRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { refreshToken: true },
        });
  
        if (!user || !user.refreshToken) {
          return false;
        }
  
        return bcrypt.compare(refreshToken, user.refreshToken);
      } catch (error) {
        throw new InternalServerErrorException('Error validating refresh token');
      }
    }
  
    private async hashPassword(password: string): Promise<string> {
      const saltRounds = 10;
      return bcrypt.hash(password, saltRounds);
    }
  }