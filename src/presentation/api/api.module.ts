import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { PushNotificationController } from './push-notification.controller';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  controllers: [EmailController, PushNotificationController, HealthController],
  imports: [CqrsModule, TerminusModule],
})
export class ApiModule {}
