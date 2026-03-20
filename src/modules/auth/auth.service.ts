import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { compareHash, hashValue } from 'src/common/utils/hash.util';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('Email is already in use');
    }

    const passwordHash = await hashValue(dto.password, this.getSaltRounds());
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        cart: {
          create: {},
        },
      },
    });

    return this.issueAuthTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compareHash(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    return this.issueAuthTokens(user.id);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      sessionId: string;
      type: 'refresh';
    }>(dto.refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    const matches = await compareHash(dto.refreshToken, session.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueAuthTokens(payload.sub);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{
      sessionId: string;
    }>(dto.refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });

    await this.prisma.refreshSession.updateMany({
      where: { id: payload.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If the account exists, a reset code has been issued.' };
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedCode = await hashValue(code, this.getSaltRounds());

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        code: hashedCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return {
      message: 'Password reset code generated',
      devOnlyResetCode: code,
    };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = await this.findValidResetToken(user.id, dto.code);
    await this.prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { verifiedAt: new Date() },
    });

    return { verified: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = await this.findValidResetToken(user.id, dto.code, true);
    const passwordHash = await hashValue(dto.newPassword, this.getSaltRounds());

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successful' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private async issueAuthTokens(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES'),
    });

    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt: this.calculateRefreshExpiry(),
      },
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        ...payload,
        sessionId: session.id,
        type: 'refresh',
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES'),
      },
    );

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        tokenHash: await hashValue(refreshToken, this.getSaltRounds()),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private sanitizeUser<T extends { passwordHash: string }>(user: T) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private getSaltRounds() {
    return this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
  }

  private calculateRefreshExpiry() {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  private async findValidResetToken(userId: string, code: string, requireVerified = false) {
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: {
        userId,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const token of tokens) {
      const matches = await compareHash(code, token.code);
      if (matches) {
        if (requireVerified && !token.verifiedAt) {
          throw new BadRequestException('Reset code must be verified first');
        }

        return token;
      }
    }

    throw new BadRequestException('Invalid or expired reset code');
  }
}
