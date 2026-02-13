import { CommandBus } from '@nestjs/cqrs';
import { SendTransactionalEmailCommand } from '../../../application/features/sendTransactionalEmail/send-transactional-email.command';
import { Receiver } from '../../../domain/email/models/receiver.model';
import { NotFoundException } from '../../../application/shared/exceptions/not-found.exception';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export async function registerSendEmailTool(
  server: McpServer,
  commandBus: CommandBus,
): Promise<void> {
  const { z } = await import('zod');

  server.registerTool(
    'notifications_send_email',
    {
      title: 'Send Transactional Email',
      description:
        'Send a transactional email using a named Brevo (SendInBlue) template.\n\n' +
        'Args:\n' +
        '  - template_name (string): Name of the email template in Brevo\n' +
        '  - receivers (array): List of recipients with email and name\n' +
        '  - parameters (object, optional): Template variables as key-value pairs\n\n' +
        'Returns: Success or error message.',
      inputSchema: {
        template_name: z
          .string()
          .min(1, 'Template name is required')
          .describe('Name of the email template in Brevo'),
        receivers: z
          .array(
            z.object({
              email: z.email('Invalid email format'),
              name: z.string().min(1, 'Receiver name is required'),
            }),
          )
          .min(1, 'At least one receiver is required')
          .describe('List of email recipients'),
        parameters: z
          .record(z.string(), z.unknown())
          .optional()
          .describe('Template variables as key-value pairs'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: {
      template_name: string;
      receivers: Array<{ email: string; name: string }>;
      parameters?: Record<string, unknown>;
    }) => {
      try {
        const receivers = params.receivers.map(
          (r) => new Receiver(r.email, r.name),
        );
        await commandBus.execute(
          new SendTransactionalEmailCommand(
            params.template_name,
            params.parameters,
            receivers,
          ),
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: `Email sent successfully using template "${
                params.template_name
              }" to ${params.receivers.map((r) => r.email).join(', ')}`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof NotFoundException
            ? error.message
            : `Failed to send email: ${
                error instanceof Error ? error.message : String(error)
              }`;
        return {
          isError: true,
          content: [{ type: 'text' as const, text: message }],
        };
      }
    },
  );
}
