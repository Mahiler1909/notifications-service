import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Notifications Service')
    .setDescription('API for sending email and push notifications')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  await initHttpServer(app, configService);
  await initGrpcServer(app, configService);
}

async function initHttpServer(
  app: INestApplication,
  configService: ConfigService,
): Promise<void> {
  const port = configService.get('http.port', 3000);
  await app.listen(port);
  logger.log(`HTTP server listening on port ${port}`);
}

async function initGrpcServer(
  app: INestApplication,
  configService: ConfigService,
): Promise<void> {
  const grpcPort = configService.get('grpc.port', 5000);
  const grpcHost = configService.get('grpc.host', 'localhost');
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      url: `${grpcHost}:${grpcPort}`,
      package: 'email',
      protoPath: join(__dirname, '../../email', 'email.proto'),
    },
  };

  const microservice = app.connectMicroservice(microserviceOptions);
  await microservice.listen();
  logger.log(`gRPC server listening on ${grpcHost}:${grpcPort}`);
}

bootstrap().catch((err) => {
  logger.error('Failed to start application', err.stack);
  process.exit(1);
});
