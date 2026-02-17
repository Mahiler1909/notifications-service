import { CommandBus } from '@nestjs/cqrs';
import { SendPushNotificationCommand } from '../../../application/features/sendPushNotification/send-push-notification.command';
import { NotificationType } from '../../../domain/push-notifications/enums/notification-type.enum';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export async function registerSendPushNotificationTool(
  server: McpServer,
  commandBus: CommandBus,
): Promise<void> {
  const { z } = await import('zod');

  server.registerTool(
    'notifications_send_push_notification',
    {
      title: 'Send Push Notification',
      description:
        'Send a push notification to one or more devices via Firebase Cloud Messaging.\n\n' +
        'Args:\n' +
        '  - device_tokens (array): FCM device tokens to send to\n' +
        '  - title (string): Notification title\n' +
        '  - body (string): Notification body text\n' +
        '  - image_url (string, optional): URL of an image to display\n' +
        '  - payload (object, optional): Custom key-value data sent to the device\n' +
        '  - notification_type (string, optional): Display style (standard, bigText, bigPicture, inbox, messaging)\n' +
        '  - custom_sound (string, optional): Custom sound name (alert_urgent, chat_sound, reminder, success)\n\n' +
        'Returns: Success or error message.',
      inputSchema: {
        device_tokens: z
          .array(z.string().min(1))
          .min(1, 'At least one device token is required')
          .describe('FCM device tokens to send the notification to'),
        title: z
          .string()
          .min(1, 'Title is required')
          .describe('Notification title'),
        body: z
          .string()
          .min(1, 'Body is required')
          .describe('Notification body text'),
        image_url: z
          .url('Must be a valid URL')
          .optional()
          .describe('URL of an image to display in the notification'),
        payload: z
          .record(z.string(), z.string())
          .optional()
          .describe('Custom data payload sent to the device'),
        notification_type: z
          .enum(['standard', 'bigText', 'bigPicture', 'inbox', 'messaging'])
          .optional()
          .describe(
            'Notification display style on Android: standard, bigText, bigPicture, inbox, messaging',
          ),
        custom_sound: z
          .string()
          .optional()
          .describe(
            'Custom sound name (alert_urgent, chat_sound, reminder, success)',
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: {
      device_tokens: Array<string>;
      title: string;
      body: string;
      image_url?: string;
      payload?: Record<string, string>;
      notification_type?: string;
      custom_sound?: string;
    }) => {
      try {
        await commandBus.execute(
          new SendPushNotificationCommand(
            params.device_tokens,
            params.title,
            params.body,
            params.image_url ?? null,
            params.payload ?? {},
            (params.notification_type as NotificationType) ??
              NotificationType.STANDARD,
            params.custom_sound ?? null,
          ),
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: `Push notification sent successfully to ${params.device_tokens.length} device(s)`,
            },
          ],
        };
      } catch (error) {
        const message = `Failed to send push notification: ${
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
