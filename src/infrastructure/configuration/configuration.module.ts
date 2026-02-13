import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { EmailProviderOptions } from './options/email-provider-options';
import { PushNotificationOptions } from './options/push-notification-options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [EmailProviderOptions, PushNotificationOptions],
  exports: [EmailProviderOptions, PushNotificationOptions],
})
export class ConfigurationModule {}
