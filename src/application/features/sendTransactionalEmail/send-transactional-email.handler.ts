import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendTransactionalEmailCommand } from './send-transactional-email.command';
import { Inject } from '@nestjs/common';
import {
  IEmailService,
  EmailServiceToken,
} from '../../../domain/email/interfaces/email-service.interface';
import { Email } from '../../../domain/email/models/email.model';
import { NotFoundException } from '../../shared/exceptions/not-found.exception';

@CommandHandler(SendTransactionalEmailCommand)
export class SendTransactionalEmailHandler
  implements ICommandHandler<SendTransactionalEmailCommand>
{
  constructor(
    @Inject(EmailServiceToken) private _emailService: IEmailService,
  ) {}

  async execute(command: SendTransactionalEmailCommand): Promise<void> {
    const templateId = await this._emailService.getTemplateIdByNameAsync(
      command.templateName,
    );

    if (templateId === null) {
      throw new NotFoundException(
        `No existe el template: ${command.templateName}`,
      );
    }
    const email = new Email(templateId, command.parameters, command.receivers);
    await this._emailService.sendEmail(email);
  }
}
