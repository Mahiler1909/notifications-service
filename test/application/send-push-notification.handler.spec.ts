import { Test, TestingModule } from '@nestjs/testing';
import { SendPushNotificationHandler } from '../../src/application/features/sendPushNotification/send-push-notification.handler';
import { SendPushNotificationCommand } from '../../src/application/features/sendPushNotification/send-push-notification.command';
import {
  IPushNotificationService,
  PushNotificationServiceToken,
} from '../../src/domain/push-notifications/interfaces/push-notification-service.interface';
import { PushNotification } from '../../src/domain/push-notifications/models/push-notification';
import { NotificationType } from '../../src/domain/push-notifications/enums/notification-type.enum';

describe('SendPushNotificationHandler', () => {
  let handler: SendPushNotificationHandler;
  let pushNotificationService: IPushNotificationService;

  const mockPushNotificationService: IPushNotificationService = {
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendPushNotificationHandler,
        {
          provide: PushNotificationServiceToken,
          useValue: mockPushNotificationService,
        },
      ],
    }).compile();

    handler = module.get(SendPushNotificationHandler);
    pushNotificationService = module.get(PushNotificationServiceToken);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should send push notification with correct parameters', async () => {
    // Arrange
    const command = new SendPushNotificationCommand(
      ['token-1', 'token-2'],
      'Test Title',
      'Test Body',
      'https://example.com/image.png',
      { key: 'value' },
    );

    // Act
    await handler.execute(command);

    // Assert
    expect(pushNotificationService.sendPushNotification).toHaveBeenCalledWith(
      new PushNotification(
        'Test Title',
        'Test Body',
        'https://example.com/image.png',
        { key: 'value' },
      ),
      ['token-1', 'token-2'],
    );
  });

  it('should handle null imageUrl', async () => {
    // Arrange
    const command = new SendPushNotificationCommand(
      ['token-1'],
      'Title',
      'Body',
      null,
      {},
    );

    // Act
    await handler.execute(command);

    // Assert
    expect(pushNotificationService.sendPushNotification).toHaveBeenCalledWith(
      new PushNotification('Title', 'Body', null, {}),
      ['token-1'],
    );
  });

  it('should pass notificationType and customSound to domain model', async () => {
    // Arrange
    const command = new SendPushNotificationCommand(
      ['token-1'],
      'Title',
      'Body',
      null,
      { bigText: 'Long text content...' },
      NotificationType.BIG_TEXT,
      'alert_urgent',
    );

    // Act
    await handler.execute(command);

    // Assert
    expect(pushNotificationService.sendPushNotification).toHaveBeenCalledWith(
      new PushNotification(
        'Title',
        'Body',
        null,
        { bigText: 'Long text content...' },
        NotificationType.BIG_TEXT,
        'alert_urgent',
      ),
      ['token-1'],
    );
  });
});
