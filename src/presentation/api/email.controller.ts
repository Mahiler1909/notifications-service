import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException as HttpNotFoundException,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SendTransactionalEmailCommand } from '../../application/features/sendTransactionalEmail/send-transactional-email.command';
import { TemplateNames } from '../../domain/email/enums/template-names.enum';
import { TransactionalEmailRequestDto } from './dto/transactional-email-request.dto';
import { NotFoundException } from '../../application/shared/exceptions/not-found.exception';

@Controller('email')
export class EmailController {
  constructor(private readonly _commandBus: CommandBus) {}

  @Post('customer-christmas')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendCustomerChristmasEmail(
    @Body() transactionalEmailRequestDto: TransactionalEmailRequestDto,
  ): Promise<void> {
    try {
      await this._commandBus.execute(
        new SendTransactionalEmailCommand(
          TemplateNames.CUSTOMER_CHRISTMAS,
          transactionalEmailRequestDto.parameters,
          transactionalEmailRequestDto.receivers,
        ),
      );
    } catch (exception) {
      if (exception instanceof NotFoundException) {
        throw new HttpNotFoundException(exception.message);
      }
      throw exception;
    }
  }
}
