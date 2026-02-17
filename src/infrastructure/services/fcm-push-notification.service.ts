import { IPushNotificationService } from '../../domain/push-notifications/interfaces/push-notification-service.interface';
import { PushNotification } from '../../domain/push-notifications/models/push-notification';
import { NotificationType } from '../../domain/push-notifications/enums/notification-type.enum';
import { JWT } from 'google-auth-library';
import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PushNotificationOptions } from '../configuration/options/push-notification-options';

export const GoogleJWTToken = Symbol('GoogleJWT');

@Injectable()
export class FcmPushNotificationService implements IPushNotificationService {
  private readonly _logger = new Logger(FcmPushNotificationService.name);
  public static MESSAGING_SCOPE =
    'https://www.googleapis.com/auth/firebase.messaging';

  constructor(
    @Inject(GoogleJWTToken) private readonly _jwtClient: JWT,
    private readonly _pushNotificationOptions: PushNotificationOptions,
  ) {}

  async sendPushNotification(
    pushNotification: PushNotification,
    deviceTokens: Array<string>,
  ): Promise<void> {
    const token = await this.generateBearerToken();

    const data: Record<string, string> = {
      title: pushNotification.title,
      body: pushNotification.body,
      ...pushNotification.payload,
    };

    if (pushNotification.imageUrl) {
      data.imageUrl = pushNotification.imageUrl;
    }

    if (pushNotification.notificationType !== NotificationType.STANDARD) {
      data.notificationType = pushNotification.notificationType;
    }

    if (pushNotification.customSound) {
      data.customSound = pushNotification.customSound;
    }

    for (const deviceToken of deviceTokens) {
      const fcmMessage = {
        message: {
          token: deviceToken,
          data,
          android: {
            priority: 'high',
          },
        },
      };

      try {
        await axios({
          method: 'post',
          url: `https://fcm.googleapis.com/v1/projects/${this._pushNotificationOptions.projectId}/messages:send`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: fcmMessage,
        });
      } catch (e) {
        this._logger.error(
          `Failed to send push notification to token ${deviceToken}`,
          e instanceof Error ? e.stack : e,
        );
      }
    }
  }

  private async generateBearerToken(): Promise<string> {
    const tokens = await this._jwtClient.authorize();
    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }
    return tokens.access_token;
  }
}
