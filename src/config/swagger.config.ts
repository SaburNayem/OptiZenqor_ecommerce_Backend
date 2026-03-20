import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const path = configService.get<string>('SWAGGER_PATH', 'docs');

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('OptiZenqor API')
      .setDescription('Unified REST API for the OptiZenqor mobile app, storefront, and admin dashboard.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
  );

  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
  });
}
