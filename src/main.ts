import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { McpService } from './presentation/mcp/mcp.service';

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

  if (process.env.MCP_TRANSPORT === 'http') {
    await initMcpRoutes(app);
  }

  const configService = app.get(ConfigService);
  await initHttpServer(app, configService);
  await initGrpcServer(app, configService);
}

async function initMcpRoutes(app: INestApplication): Promise<void> {
  const mcpService = app.get(McpService);
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  );

  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.post('/mcp', async (req: Request, res: Response) => {
    const server = await mcpService.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  expressApp.get('/mcp', (_req: Request, res: Response) => {
    res
      .status(405)
      .json({ error: 'Method not allowed. Use POST for MCP requests.' });
  });

  expressApp.delete('/mcp', (_req: Request, res: Response) => {
    res
      .status(405)
      .json({ error: 'Method not allowed. Sessions are not supported.' });
  });

  logger.log('MCP HTTP routes mounted at /mcp');
}

async function initHttpServer(
  app: INestApplication,
  configService: ConfigService,
): Promise<void> {
  const port = configService.get<number>('http.port', 3000);
  await app.listen(port);
  logger.log(`HTTP server listening on port ${port}`);
}

async function initGrpcServer(
  app: INestApplication,
  configService: ConfigService,
): Promise<void> {
  const grpcPort = configService.get<number>('grpc.port', 5000);
  const grpcHost = configService.get<string>('grpc.host', '0.0.0.0');
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      url: `${grpcHost}:${grpcPort}`,
      package: 'email',
      protoPath: join(__dirname, '../email', 'email.proto'),
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
