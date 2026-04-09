import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RecoverDto, ResetDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login and get Access JWT' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('recover-password')
  @ApiOperation({ summary: 'Initiate password recovery flow' })
  recoverPassword(@Body() recoverDto: RecoverDto) {
    return this.authService.recoverPassword(recoverDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  resetPassword(@Body() resetDto: ResetDto) {
    return this.authService.resetPassword(resetDto);
  }
}
