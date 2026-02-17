import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendPushNotificationCommand } from './send-push-notification.command';
import { Inject } from '@nestjs/common';
import {
  IPushNotificationService,
  PushNotificationServiceToken,
} from '../../../domain/push-notifications/interfaces/push-notification-service.interface';
import { PushNotification } from '../../../domain/push-notifications/models/push-notification';

@CommandHandler(SendPushNotificationCommand)
export class SendPushNotificationHandler
  implements ICommandHandler<SendPushNotificationCommand>
{
  constructor(
    @Inject(PushNotificationServiceToken)
    private _pushNotificationService: IPushNotificationService,
  ) {}

  async execute(command: SendPushNotificationCommand): Promise<void> {
    const pushNotification = new PushNotification(
      command.title,
      command.body,
      command.imageUrl,
      command.payload,
      command.notificationType,
      command.customSound,
    );
    await this._pushNotificationService.sendPushNotification(
      pushNotification,
      command.deviceTokens,
    );
  }
}
