import { Module, Provider } from '@nestjs/common';
import { SendInBlueEmailService } from './services/send-in-blue-email.service';
import admin from 'firebase-admin';
import { PushNotificationServiceToken } from '../domain/push-notifications/interfaces/push-notification-service.interface';
import { EmailServiceToken } from '../domain/email/interfaces/email-service.interface';
import { EmailProviderOptions } from './configuration/options/email-provider-options';
import { ConfigurationModule } from './configuration/configuration.module';
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from '@sendinblue/client';
import {
  FcmSdkPushNotificationService,
  GoogleMessagingToken,
} from './services/fcm-sdk-push-notification.service';
import {
  FcmPushNotificationService,
  GoogleJWTToken,
} from './services/fcm-push-notification.service';
import { JWT } from 'google-auth-library';

type PushProvider = 'sdk' | 'http';

function buildPushNotificationProviders(provider: PushProvider): Provider[] {
  if (provider === 'http') {
    return [
      FcmPushNotificationService,
      {
        provide: PushNotificationServiceToken,
        useExisting: FcmPushNotificationService,
      },
      {
        provide: GoogleJWTToken,
        useFactory: (): JWT => {
          return new JWT({
            scopes: [FcmPushNotificationService.MESSAGING_SCOPE],
          });
        },
      },
    ];
  }

  // Default: SDK-based
  return [
    FcmSdkPushNotificationService,
    {
      provide: PushNotificationServiceToken,
      useExisting: FcmSdkPushNotificationService,
    },
    {
      provide: GoogleMessagingToken,
      useFactory: (): admin.messaging.Messaging => {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        return admin.messaging();
      },
    },
  ];
}

const pushProvider: PushProvider =
  (process.env.PUSH_NOTIFICATION_PROVIDER as PushProvider) || 'sdk';

@Module({
  providers: [
    SendInBlueEmailService,
    { provide: EmailServiceToken, useExisting: SendInBlueEmailService },
    ...buildPushNotificationProviders(pushProvider),
    {
      inject: [EmailProviderOptions],
      provide: TransactionalEmailsApi,
      useFactory: async (
        emailProviderOptions: EmailProviderOptions,
      ): Promise<TransactionalEmailsApi> => {
        const transactionalEmailsApi = new TransactionalEmailsApi();
        transactionalEmailsApi.setApiKey(
          TransactionalEmailsApiApiKeys.apiKey,
          emailProviderOptions.apiKey,
        );
        return transactionalEmailsApi;
      },
    },
  ],
  exports: [EmailServiceToken, PushNotificationServiceToken],
  imports: [ConfigurationModule],
})
export class InfrastructureModule {}
