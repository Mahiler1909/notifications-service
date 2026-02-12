import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { TransactionalEmailRequestDto } from '../api/dto/transactional-email-request.dto';
import { CommandBus } from '@nestjs/cqrs';
import { SendTransactionalEmailCommand } from '../../application/features/sendTransactionalEmail/send-transactional-email.command';
import { NotFoundException } from '../../application/shared/exceptions/not-found.exception';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Controller()
export class GrpcController {
  constructor(private readonly _commandBus: CommandBus) {}

  @GrpcMethod('EmailService', 'SendTransactionalEmail')
  async sendTransactionalEmail(
    data: TransactionalEmailRequestDto,
  ): Promise<void> {
    try {
      await this._commandBus.execute(
        new SendTransactionalEmailCommand(
          data.templateName,
          data.parameters,
          data.receivers,
        ),
      );
    } catch (exception) {
      const code =
        exception instanceof NotFoundException
          ? GrpcStatus.NOT_FOUND
          : GrpcStatus.INTERNAL;
      throw new RpcException({ code, message: exception.message });
    }
  }
}
