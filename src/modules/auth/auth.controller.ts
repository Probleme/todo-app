import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthService } from './auth.service';
  import { LoginDto } from './dto/login.dto';
  import { RefreshTokenDto } from './dto/refresh-token.dto';
  import { ForgotPasswordDto } from './dto/forgot-password.dto';
  import { ResetPasswordDto } from './dto/reset-password.dto';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { ThrottlerGuard } from '@nestjs/throttler';
  
  @ApiTags('auth')
  @Controller('auth')
  @UseGuards(ThrottlerGuard)
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'User has been logged in successfully' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }
  
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token has been refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
      return this.authService.refreshToken(refreshTokenDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 200, description: 'User has been logged out successfully' })
    logout(@Request() req) {
      return this.authService.logout(req.user.id);
    }
  
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Password reset token has been generated' })
    @ApiResponse({ status: 404, description: 'User not found' })
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
      return this.authService.forgotPassword(forgotPasswordDto);
    }
  
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password has been reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
      return this.authService.resetPassword(resetPasswordDto);
    }
  }