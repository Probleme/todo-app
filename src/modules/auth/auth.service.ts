import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { UsersService } from '../users/users.service';
  import { PrismaService } from '../../prisma/prisma.service';
  import { LoginDto } from './dto/login.dto';
  import { RefreshTokenDto } from './dto/refresh-token.dto';
  import { ForgotPasswordDto } from './dto/forgot-password.dto';
  import { ResetPasswordDto } from './dto/reset-password.dto';
  import * as bcrypt from 'bcryptjs';
  import { randomBytes } from 'crypto';
  import { CACHE_MANAGER } from '@nestjs/cache-manager';
  import { Cache } from 'cache-manager';
  import { Inject } from '@nestjs/common';
  
  @Injectable()
  export class AuthService {
    constructor(
      private usersService: UsersService,
      private jwtService: JwtService,
      private configService: ConfigService,
      private prisma: PrismaService,
      @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}
  
    async validateUser(email: string, password: string) {
      try {
        const user = await this.usersService.findByEmail(email);
        
        if (!user) {
          return null;
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return null;
        }
        
        const { password: _, ...result } = user;
        return result;
      } catch (error) {
        throw new InternalServerErrorException('Error validating user credentials');
      }
    }
  
    async login(loginDto: LoginDto) {
      try {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        
        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
  
        const tokens = await this.generateTokens(user);
        
        // Store refresh token
        await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
        
        // Cache access token for future validation (optional - for blacklisting)
        // Fix: Provide a default expiration time if config is missing
        const jwtExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
        
        await this.cacheManager.set(
          `user_token:${user.id}`,
          tokens.accessToken,
          this.getMillisecondsFromJwtExpiry(jwtExpiry),
        );
  
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          ...tokens,
        };
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new InternalServerErrorException('Error during login');
      }
    }
  
    async refreshToken(refreshTokenDto: RefreshTokenDto) {
      try {
        const decoded = this.jwtService.verify(refreshTokenDto.refreshToken, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
  
        const user = await this.usersService.findOne(decoded.sub);
        const isRefreshTokenValid = await this.usersService.validateRefreshToken(
          user.id,
          refreshTokenDto.refreshToken,
        );
  
        if (!isRefreshTokenValid) {
          throw new UnauthorizedException('Invalid refresh token');
        }
  
        const tokens = await this.generateTokens(user);
        
        // Update refresh token
        await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
        
        // Update cached access token
        // Fix: Provide a default expiration time if config is missing
        const jwtExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
        
        await this.cacheManager.set(
          `user_token:${user.id}`,
          tokens.accessToken,
          this.getMillisecondsFromJwtExpiry(jwtExpiry),
        );
  
        return tokens;
      } catch (error) {
        if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
          throw error;
        }
        throw new UnauthorizedException('Invalid refresh token');
      }
    }
  
    async logout(userId: number) {
      try {
        // Remove refresh token from database
        await this.usersService.setRefreshToken(userId, null);
        
        // Invalidate cached token (effectively blacklisting it)
        await this.cacheManager.del(`user_token:${userId}`);
        
        return { message: 'Logout successful' };
      } catch (error) {
        throw new InternalServerErrorException('Error during logout');
      }
    }
  
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
      try {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
  
        // Generate reset token and set expiration (1 hour)
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExp = new Date(Date.now() + 3600000); // 1 hour
  
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExp,
          },
        });
  
        // In a real-world application, you would send this token via email
        // For this assignment, we'll just return it
        return {
          message: 'Password reset token generated successfully',
          resetToken, // Note: In production, you shouldn't return this
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException('Error generating password reset token');
      }
    }
  
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
      try {
        const user = await this.prisma.user.findFirst({
          where: {
            resetToken: resetPasswordDto.token,
            resetTokenExp: {
              gt: new Date(),
            },
          },
        });
  
        if (!user) {
          throw new BadRequestException('Invalid or expired password reset token');
        }
  
        // Hash the new password
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
  
        // Update the user's password and clear the reset token
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExp: null,
          },
        });
  
        return { message: 'Password has been reset successfully' };
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Error resetting password');
      }
    }
  
    private async generateTokens(user: any) {
      try {
        const payload = { email: user.email, sub: user.id };
        
        // Fix: Provide default values if config is missing
        const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret-key-for-jwt';
        const accessExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
        const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
        
        const accessToken = this.jwtService.sign(payload, {
          secret: jwtSecret,
          expiresIn: accessExpiry,
        });
        
        const refreshToken = this.jwtService.sign(payload, {
          secret: jwtSecret,
          expiresIn: refreshExpiry,
        });
  
        return {
          accessToken,
          refreshToken,
        };
      } catch (error) {
        throw new InternalServerErrorException('Error generating authentication tokens');
      }
    }
  
    private getMillisecondsFromJwtExpiry(expiry: string): number {
      // Parse JWT expiry like "15m", "1h", "7d" to milliseconds
      const unit = expiry.slice(-1);
      const value = parseInt(expiry.slice(0, -1), 10);
      
      switch (unit) {
        case 's':
          return value * 1000;
        case 'm':
          return value * 60 * 1000;
        case 'h':
          return value * 60 * 60 * 1000;
        case 'd':
          return value * 24 * 60 * 60 * 1000;
        default:
          return 900000; // 15 minutes default
      }
    }
  }