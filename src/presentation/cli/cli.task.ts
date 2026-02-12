/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommandBus } from '@nestjs/cqrs';
import { SendTransactionalEmailCommand } from '../../application/features/sendTransactionalEmail/send-transactional-email.command';
import { Receiver } from '../../domain/email/models/receiver.model';
import { Command, CommandRunner, Option } from 'nest-commander';
import * as figlet from 'figlet';
import {
  spinnerError,
  spinnerSuccess,
  updateSpinnerText,
} from './helpers/spinner.helper';

@Command({
  name: 'send-email',
  options: { isDefault: false },
})
export class CliTask extends CommandRunner {
  constructor(private readonly _commandBus: CommandBus) {
    super();
  }

  @Option({
    flags: '-t, --template <template>',
    description: 'Template name',
    required: true,
  })
  parseTemplate(val: string): string {
    return val;
  }

  @Option({
    flags: '-e, --email <email>',
    description: 'Receiver email',
    required: true,
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --name <name>',
    description: 'Receiver name',
    required: true,
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --params <params>',
    description: 'Template parameters (JSON string)',
    required: true,
  })
  parseParameters(val: string): string {
    return val;
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const title = await new Promise<string>((resolve, reject) => {
      figlet.text('Notification Service', (error, result) => {
        if (error) return reject(error);
        resolve(result ?? '');
      });
    });
    console.log(title);
    await this.sendEmail(options);
  }

  private async sendEmail(options: Record<string, any>): Promise<void> {
    try {
      updateSpinnerText('Sending email');

      let params: Record<string, unknown>;
      try {
        params = JSON.parse(options['params']);
      } catch {
        spinnerError('Invalid JSON in --params');
        return;
      }

      const receivers = [new Receiver(options['email'], options['name'])];
      await this._commandBus.execute(
        new SendTransactionalEmailCommand(
          options['template'],
          params,
          receivers,
        ),
      );
      spinnerSuccess(`Email sent successfully to ${options['email']}`);
    } catch (exception) {
      spinnerError(
        `An error occurred while sending the email -> ${exception.message}`,
      );
    }
  }
}
