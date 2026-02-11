import { Receiver } from '../../../domain/email/models/receiver.model';

export class SendTransactionalEmailCommand {
  constructor(
    public readonly templateName: string,
    public readonly parameters: Record<string, unknown>,
    public readonly receivers: Array<Receiver>,
  ) {}
}
