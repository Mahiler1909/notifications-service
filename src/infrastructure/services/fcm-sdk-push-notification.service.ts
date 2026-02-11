import { IPushNotificationService } from '../../domain/push-notifications/interfaces/push-notification-service.interface';
import { PushNotification } from '../../domain/push-notifications/models/push-notification';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Messaging } from 'firebase-admin/lib/messaging';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

export const GoogleMessagingToken = Symbol('GoogleMessaging');

@Injectable()
export class FcmSdkPushNotificationService implements IPushNotificationService {
  private readonly _logger = new Logger(FcmSdkPushNotificationService.name);

  constructor(
    @Inject(GoogleMessagingToken) private readonly _googleMessaging: Messaging,
  ) {}

  async sendPushNotification(
    pushNotification: PushNotification,
    deviceTokens: Array<string>,
  ): Promise<void> {
    const multicastMessage: MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title: pushNotification.title,
        body: pushNotification.body,
        imageUrl: pushNotification.imageUrl ?? undefined,
      },
      data: pushNotification.payload,
    };

    const batchResponse = await this._googleMessaging.sendEachForMulticast(
      multicastMessage,
    );

    if (batchResponse.failureCount > 0) {
      const failedTokens: string[] = [];
      batchResponse.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(deviceTokens[idx]);
        }
      });
      this._logger.warn(
        `Push notification failures: ${batchResponse.failureCount}/${deviceTokens.length} tokens failed`,
        { failedTokens },
      );
    }
  }
}
