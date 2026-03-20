import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES!: string;

  @IsUrl({ require_tld: false })
  APP_URL!: string;

  @IsUrl({ require_tld: false })
  FRONTEND_WEB_URL!: string;

  @IsUrl({ require_tld: false })
  FRONTEND_ADMIN_URL!: string;

  @IsString()
  @IsNotEmpty()
  FRONTEND_MOBILE_SCHEME!: string;

  @IsInt()
  @Min(4)
  BCRYPT_SALT_ROUNDS!: number;

  @IsInt()
  @Min(1)
  THROTTLE_TTL!: number;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT!: number;

  @IsOptional()
  @IsString()
  SWAGGER_PATH?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
