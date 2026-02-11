/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { SendInBlueEmailService } from '../../../src/infrastructure/services/send-in-blue-email.service';
import { EmailServiceToken } from '../../../src/domain/email/interfaces/email-service.interface';
import { ConfigurationModuleMock } from '../../mocks/modules/configuration.module.mock';
import {
  CreateSmtpEmail,
  GetSmtpTemplateOverview,
  GetSmtpTemplates,
  SendSmtpEmail,
  SendSmtpEmailTo,
  TransactionalEmailsApi,
} from '@sendinblue/client';
import { Email } from '../../../src/domain/email/models/email.model';
import { Receiver } from '../../../src/domain/email/models/receiver.model';

describe('SendInBlueEmailService', () => {
  let sut: SendInBlueEmailService;
  let transactionalEmailsApi: TransactionalEmailsApi;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionalEmailsApi,
        SendInBlueEmailService,
        { provide: EmailServiceToken, useExisting: SendInBlueEmailService },
      ],
      imports: [ConfigurationModuleMock],
    }).compile();

    sut = await module.resolve<SendInBlueEmailService>(SendInBlueEmailService);
    transactionalEmailsApi = module.get<TransactionalEmailsApi>(
      TransactionalEmailsApi,
    );
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should be return template Id when template exist in getTemplateIdByNameAsync method', async () => {
    // Arrange
    const templateName = 'template-name';
    const templateId = 1;

    const getSmtpTemplateOverview = new GetSmtpTemplateOverview();
    getSmtpTemplateOverview.name = templateName;
    getSmtpTemplateOverview.id = templateId;

    const getSmtpTemplates = new GetSmtpTemplates();
    getSmtpTemplates.templates = [getSmtpTemplateOverview];

    const transactionalEmailsApiExecute = jest.spyOn(
      transactionalEmailsApi,
      'getSmtpTemplates',
    );

    transactionalEmailsApiExecute.mockResolvedValue({
      response: undefined as any,
      body: getSmtpTemplates,
    });

    // Act
    const currentResult = await sut.getTemplateIdByNameAsync(templateName);

    // Assert
    expect(currentResult).toBe(templateId);
    expect(transactionalEmailsApiExecute).toHaveBeenCalled();
  });

  it('should be return null when template does not exist in getTemplateIdByNameAsync method', async () => {
    // Arrange
    const templateName = 'template-name';

    const getSmtpTemplateOverview = new GetSmtpTemplateOverview();
    getSmtpTemplateOverview.name = 'template-name-2';

    const getSmtpTemplates = new GetSmtpTemplates();
    getSmtpTemplates.templates = [getSmtpTemplateOverview];

    const transactionalEmailsApiExecute = jest.spyOn(
      transactionalEmailsApi,
      'getSmtpTemplates',
    );
    transactionalEmailsApiExecute.mockResolvedValue({
      response: undefined as any,
      body: getSmtpTemplates,
    });

    // Act
    const currentResult = await sut.getTemplateIdByNameAsync(templateName);

    // Assert
    expect(currentResult).toBeNull();
    expect(transactionalEmailsApiExecute).toHaveBeenCalled();
  });

  it('should be return messageId when sendTransacEmail call successfully in sendEmail method', async () => {
    // Arrange
    const templateId = 1;
    const messageIdCreated = '123';
    const receiver = new Receiver('name@domain.com', 'name');
    const email = new Email(templateId, { param: 'value' }, [receiver]);

    const createSmtpTemplate = new CreateSmtpEmail();
    createSmtpTemplate.messageId = messageIdCreated;

    const transactionalEmailsApiExecute = jest.spyOn(
      transactionalEmailsApi,
      'sendTransacEmail',
    );
    transactionalEmailsApiExecute.mockResolvedValue({
      response: undefined as any,
      body: createSmtpTemplate,
    });

    // Act
    const currentResult = await sut.sendEmail(email);

    // Assert
    const sendSmtpEmailTo = new SendSmtpEmailTo();
    sendSmtpEmailTo.name = receiver.name;
    sendSmtpEmailTo.email = receiver.email;

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.templateId = email.templateId;
    sendSmtpEmail.params = email.parameters;
    sendSmtpEmail.to = [sendSmtpEmailTo];

    expect(currentResult).toBe(messageIdCreated);
    expect(transactionalEmailsApiExecute).toHaveBeenCalled();
    expect(transactionalEmailsApiExecute).toHaveBeenCalledWith(sendSmtpEmail);
  });
});
