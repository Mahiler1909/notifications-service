import { Test, TestingModule } from '@nestjs/testing';
import {
  FcmSdkPushNotificationService,
  GoogleMessagingToken,
} from '../../../src/infrastructure/services/fcm-sdk-push-notification.service';
import { PushNotification } from '../../../src/domain/push-notifications/models/push-notification';
import { NotificationType } from '../../../src/domain/push-notifications/enums/notification-type.enum';

describe('FcmSdkPushNotificationService', () => {
  let service: FcmSdkPushNotificationService;
  let mockMessaging: { sendEachForMulticast: jest.Mock };

  beforeEach(async () => {
    mockMessaging = {
      sendEachForMulticast: jest.fn().mockResolvedValue({
        failureCount: 0,
        responses: [{ success: true }],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmSdkPushNotificationService,
        { provide: GoogleMessagingToken, useValue: mockMessaging },
      ],
    }).compile();

    service = module.get(FcmSdkPushNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send data-only message without notification block', async () => {
    const pushNotification = new PushNotification('Title', 'Body', null, {});

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.notification).toBeUndefined();
    expect(call.data).toEqual({ title: 'Title', body: 'Body' });
  });

  it('should set android priority to high', async () => {
    const pushNotification = new PushNotification('Title', 'Body', null, {});

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.android).toEqual({ priority: 'high' });
  });

  it('should include imageUrl in data when provided', async () => {
    const pushNotification = new PushNotification(
      'Title',
      'Body',
      'https://example.com/img.png',
      {},
    );

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data.imageUrl).toBe('https://example.com/img.png');
  });

  it('should not include imageUrl in data when null', async () => {
    const pushNotification = new PushNotification('Title', 'Body', null, {});

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data.imageUrl).toBeUndefined();
  });

  it('should include notificationType when not STANDARD', async () => {
    const pushNotification = new PushNotification(
      'Title',
      'Body',
      null,
      {},
      NotificationType.BIG_TEXT,
    );

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data.notificationType).toBe('bigText');
  });

  it('should not include notificationType when STANDARD', async () => {
    const pushNotification = new PushNotification('Title', 'Body', null, {});

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data.notificationType).toBeUndefined();
  });

  it('should include customSound when provided', async () => {
    const pushNotification = new PushNotification(
      'Title',
      'Body',
      null,
      {},
      NotificationType.STANDARD,
      'alert_urgent',
    );

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data.customSound).toBe('alert_urgent');
  });

  it('should not include customSound when null', async () => {
    const pushNotification = new PushNotification('Title', 'Body', null, {});

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data.customSound).toBeUndefined();
  });

  it('should merge user payload fields into data', async () => {
    const pushNotification = new PushNotification('Title', 'Body', null, {
      bigText: 'Long expanded text...',
      actions: '[{"id":"accept","label":"Aceptar"}]',
    });

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data).toEqual({
      title: 'Title',
      body: 'Body',
      bigText: 'Long expanded text...',
      actions: '[{"id":"accept","label":"Aceptar"}]',
    });
  });

  it('should build full rich notification data payload', async () => {
    const pushNotification = new PushNotification(
      'Grupo del proyecto',
      '3 mensajes nuevos',
      null,
      {
        conversationTitle: 'Grupo del proyecto',
        chatMessages:
          '[{"sender":"Ana","text":"Hola!","timestamp":1700000000000}]',
        actions: '[{"id":"reply","label":"Responder","isReplyAction":true}]',
      },
      NotificationType.MESSAGING,
      'chat_sound',
    );

    await service.sendPushNotification(pushNotification, ['token-1']);

    const call = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data).toEqual({
      title: 'Grupo del proyecto',
      body: '3 mensajes nuevos',
      conversationTitle: 'Grupo del proyecto',
      chatMessages:
        '[{"sender":"Ana","text":"Hola!","timestamp":1700000000000}]',
      actions: '[{"id":"reply","label":"Responder","isReplyAction":true}]',
      notificationType: 'messaging',
      customSound: 'chat_sound',
    });
    expect(call.android).toEqual({ priority: 'high' });
  });

  it('should log warning on partial failures', async () => {
    mockMessaging.sendEachForMulticast.mockResolvedValue({
      failureCount: 1,
      responses: [{ success: true }, { success: false }],
    });

    const pushNotification = new PushNotification('Title', 'Body', null, {});

    await service.sendPushNotification(pushNotification, [
      'token-1',
      'token-2',
    ]);

    expect(mockMessaging.sendEachForMulticast).toHaveBeenCalled();
  });
});
