import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { McpService } from './mcp.service';

@Module({
  imports: [CqrsModule],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
