import { Receiver } from './receiver.model';

export class Email {
  constructor(
    public readonly templateId: number,
    public readonly parameters: Record<string, unknown> | undefined,
    public readonly receivers: Array<Receiver>,
  ) {
    if (templateId <= 0) {
      throw new Error(`Invalid templateId: ${templateId}`);
    }
    if (!receivers.length) {
      throw new Error('At least one receiver is required');
    }
  }
}
