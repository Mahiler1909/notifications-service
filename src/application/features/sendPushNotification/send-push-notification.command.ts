import { NotificationType } from '../../../domain/push-notifications/enums/notification-type.enum';

export class SendPushNotificationCommand {
  constructor(
    public readonly deviceTokens: Array<string>,
    public readonly title: string,
    public readonly body: string,
    public readonly imageUrl: string | null,
    public readonly payload: Record<string, string>,
    public readonly notificationType: NotificationType = NotificationType.STANDARD,
    public readonly customSound: string | null = null,
  ) {}
}
