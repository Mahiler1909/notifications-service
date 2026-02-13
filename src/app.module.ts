import { Module } from '@nestjs/common';
import { ApiModule } from './presentation/api/api.module';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ConfigurationModule } from './infrastructure/configuration/configuration.module';
import { CliModule } from './presentation/cli/cli.module';
import { GrpcModule } from './presentation/grpc/grpc.module';
import { McpModule } from './presentation/mcp/mcp.module';

@Module({
  imports: [
    CliModule,
    ApiModule,
    ApplicationModule,
    InfrastructureModule,
    ConfigurationModule,
    GrpcModule,
    McpModule,
  ],
})
export class AppModule {}
