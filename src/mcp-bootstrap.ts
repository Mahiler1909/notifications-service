import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { McpService } from './presentation/mcp/mcp.service';

async function runStdio(mcpService: McpService): Promise<void> {
  const server = await mcpService.createServer();
  const { StdioServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/stdio.js'
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running via stdio');
}

async function runHttp(mcpService: McpService): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  );

  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = await mcpService.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get('/mcp', (_req: Request, res: Response) => {
    res
      .status(405)
      .json({ error: 'Method not allowed. Use POST for MCP requests.' });
  });

  app.delete('/mcp', (_req: Request, res: Response) => {
    res
      .status(405)
      .json({ error: 'Method not allowed. Sessions are not supported.' });
  });

  const port = parseInt(process.env.MCP_PORT || '3001', 10);
  app.listen(port, () => {
    console.error(`MCP HTTP server running on http://localhost:${port}/mcp`);
  });
}

async function bootstrap(): Promise<void> {
  const nestApp = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const mcpService = nestApp.get(McpService);

  const transport = process.env.MCP_TRANSPORT || 'stdio';
  if (transport === 'http') {
    await runHttp(mcpService);
  } else {
    await runStdio(mcpService);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start MCP server', err);
  process.exit(1);
});
