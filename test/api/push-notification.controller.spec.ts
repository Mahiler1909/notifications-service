import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationController } from '../../src/presentation/api/push-notification.controller';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { PushNotificationRequestDto } from '../../src/presentation/api/dto/push-notification-request.dto';
import { NotificationType } from '../../src/domain/push-notifications/enums/notification-type.enum';

describe('PushNotificationController', () => {
  let controller: PushNotificationController;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushNotificationController],
      imports: [CqrsModule],
    }).compile();

    controller = module.get(PushNotificationController);
    commandBus = module.get(CommandBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should execute SendPushNotificationCommand', async () => {
    // Arrange
    const commandBusExecute = jest.spyOn(commandBus, 'execute');
    commandBusExecute.mockResolvedValue(undefined);

    const dto = {
      deviceTokens: ['token-1'],
      notification: {
        title: 'Test',
        body: 'Body',
        imageUrl: null,
        payload: { key: 'value' },
      },
    } as PushNotificationRequestDto;

    // Act
    await controller.sendPushNotification(dto);

    // Assert
    expect(commandBusExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceTokens: ['token-1'],
        title: 'Test',
        body: 'Body',
        imageUrl: null,
        payload: { key: 'value' },
      }),
    );
  });

  it('should pass notificationType and customSound to command', async () => {
    // Arrange
    const commandBusExecute = jest.spyOn(commandBus, 'execute');
    commandBusExecute.mockResolvedValue(undefined);

    const dto = {
      deviceTokens: ['token-1'],
      notification: {
        title: 'Test',
        body: 'Body',
        imageUrl: null,
        payload: { bigText: 'Expanded text...' },
        notificationType: NotificationType.BIG_TEXT,
        customSound: 'chat_sound',
      },
    } as PushNotificationRequestDto;

    // Act
    await controller.sendPushNotification(dto);

    // Assert
    expect(commandBusExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceTokens: ['token-1'],
        title: 'Test',
        body: 'Body',
        notificationType: NotificationType.BIG_TEXT,
        customSound: 'chat_sound',
        payload: { bigText: 'Expanded text...' },
      }),
    );
  });

  it('should propagate errors from command bus', async () => {
    // Arrange
    const commandBusExecute = jest.spyOn(commandBus, 'execute');
    commandBusExecute.mockRejectedValue(new Error('FCM error'));

    const dto = {
      deviceTokens: ['token-1'],
      notification: {
        title: 'Test',
        body: 'Body',
        imageUrl: null,
        payload: {},
      },
    } as PushNotificationRequestDto;

    // Act & Assert
    await expect(controller.sendPushNotification(dto)).rejects.toThrow(
      'FCM error',
    );
  });
});
