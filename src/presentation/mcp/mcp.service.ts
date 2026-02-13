import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSendEmailTool } from './tools/send-email.tool';
import { registerSendPushNotificationTool } from './tools/send-push-notification.tool';

@Injectable()
export class McpService {
  constructor(private readonly _commandBus: CommandBus) {}

  async createServer(): Promise<McpServer> {
    const { McpServer } = await import(
      '@modelcontextprotocol/sdk/server/mcp.js'
    );

    const server = new McpServer({
      name: 'notifications-mcp-server',
      version: '1.0.0',
    });

    await registerSendEmailTool(server, this._commandBus);
    await registerSendPushNotificationTool(server, this._commandBus);

    return server;
  }
}
