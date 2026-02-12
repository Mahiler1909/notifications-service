import { CommandBus } from '@nestjs/cqrs';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SendPushNotificationCommand } from '../../application/features/sendPushNotification/send-push-notification.command';
import { PushNotificationRequestDto } from './dto/push-notification-request.dto';

@ApiTags('Push Notifications')
@Controller('push-notification')
export class PushNotificationController {
  constructor(private readonly _commandBus: CommandBus) {}

  @Post('send')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send push notification to devices' })
  @ApiResponse({ status: 204, description: 'Push notification sent successfully' })
  async sendPushNotification(
    @Body() pushNotificationRequestDto: PushNotificationRequestDto,
  ): Promise<void> {
    await this._commandBus.execute(
      new SendPushNotificationCommand(
        pushNotificationRequestDto.deviceTokens,
        pushNotificationRequestDto.notification.title,
        pushNotificationRequestDto.notification.body,
        pushNotificationRequestDto.notification.imageUrl,
        pushNotificationRequestDto.notification.payload,
      ),
    );
  }
}
