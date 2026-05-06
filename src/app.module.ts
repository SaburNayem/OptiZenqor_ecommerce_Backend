import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminsModule } from './modules/admins/admins.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { OffersModule } from './modules/offers/offers.module';
import { SupportModule } from './modules/support/support.module';
import { ContentModule } from './modules/content/content.module';
import { FeaturesModule } from './modules/features/features.module';
import { SystemModule } from './modules/system/system.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { WebController } from './web.controller';

@Module({
  controllers: [WebController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT', 60),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminsModule,
    ProductsModule,
    CategoriesModule,
    FavoritesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    HomepageModule,
    OffersModule,
    SupportModule,
    ContentModule,
    FeaturesModule,
    SystemModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
