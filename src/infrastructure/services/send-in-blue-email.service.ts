import { IEmailService } from '../../domain/email/interfaces/email-service.interface';
import { Email } from '../../domain/email/models/email.model';
import { Injectable } from '@nestjs/common';
import {
  SendSmtpEmail,
  SendSmtpEmailTo,
  TransactionalEmailsApi,
} from '@sendinblue/client';

@Injectable()
export class SendInBlueEmailService implements IEmailService {
  constructor(
    private readonly _transactionalEmailApi: TransactionalEmailsApi,
  ) {}

  async getTemplateIdByNameAsync(templateName: string): Promise<number | null> {
    const templates = await this._transactionalEmailApi.getSmtpTemplates();
    const template = templates.body.templates?.find(
      (t) => t.name === templateName,
    );

    if (!template) {
      return null;
    }

    return template.id;
  }

  async sendEmail(email: Email): Promise<string> {
    const sendSmtpEmail = this.generateSendSmtpEmail(email);
    const createdSmtpEmail = await this._transactionalEmailApi.sendTransacEmail(
      sendSmtpEmail,
    );
    return createdSmtpEmail.body.messageId ?? '';
  }

  private generateSendSmtpEmail(email: Email): SendSmtpEmail {
    const sendSmtpEmail = new SendSmtpEmail();

    sendSmtpEmail.to = email.receivers.map((receiver) => {
      const emailTo = new SendSmtpEmailTo();
      emailTo.name = receiver.name;
      emailTo.email = receiver.email;
      return emailTo;
    });

    sendSmtpEmail.templateId = email.templateId;

    if (email.parameters && Object.keys(email.parameters).length > 0) {
      sendSmtpEmail.params = email.parameters;
    }

    return sendSmtpEmail;
  }
}
