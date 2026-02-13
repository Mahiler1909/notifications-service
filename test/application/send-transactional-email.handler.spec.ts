import { Test, TestingModule } from '@nestjs/testing';
import { SendTransactionalEmailHandler } from '../../src/application/features/sendTransactionalEmail/send-transactional-email.handler';
import { SendTransactionalEmailCommand } from '../../src/application/features/sendTransactionalEmail/send-transactional-email.command';
import {
  IEmailService,
  EmailServiceToken,
} from '../../src/domain/email/interfaces/email-service.interface';
import { NotFoundException } from '../../src/application/shared/exceptions/not-found.exception';
import { Receiver } from '../../src/domain/email/models/receiver.model';

describe('SendTransactionalEmailHandler', () => {
  let handler: SendTransactionalEmailHandler;
  let emailService: IEmailService;

  const mockEmailService: IEmailService = {
    sendEmail: jest.fn().mockResolvedValue('message-id-123'),
    getTemplateIdByNameAsync: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendTransactionalEmailHandler,
        { provide: EmailServiceToken, useValue: mockEmailService },
      ],
    }).compile();

    handler = module.get(SendTransactionalEmailHandler);
    emailService = module.get(EmailServiceToken);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should send email when template exists', async () => {
    // Arrange
    (emailService.getTemplateIdByNameAsync as jest.Mock).mockResolvedValue(5);
    const command = new SendTransactionalEmailCommand(
      'tp-customer-christmas',
      { NAME: 'Test' },
      [new Receiver('test@example.com', 'Test')],
    );

    // Act
    await handler.execute(command);

    // Assert
    expect(emailService.getTemplateIdByNameAsync).toHaveBeenCalledWith(
      'tp-customer-christmas',
    );
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 5,
        parameters: { NAME: 'Test' },
      }),
    );
  });

  it('should throw NotFoundException when template does not exist', async () => {
    // Arrange
    (emailService.getTemplateIdByNameAsync as jest.Mock).mockResolvedValue(
      null,
    );
    const command = new SendTransactionalEmailCommand('non-existent', {}, [
      new Receiver('test@example.com', 'Test'),
    ]);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });
});
