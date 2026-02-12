import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException as HttpNotFoundException,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { SendTransactionalEmailCommand } from '../../application/features/sendTransactionalEmail/send-transactional-email.command';
import { TransactionalEmailRequestDto } from './dto/transactional-email-request.dto';
import { NotFoundException } from '../../application/shared/exceptions/not-found.exception';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly _commandBus: CommandBus) {}

  @Post('send')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send transactional email using a named template' })
  @ApiResponse({ status: 204, description: 'Email sent successfully' })
  @ApiResponse({ status: 404, description: 'Email template not found' })
  async sendTransactionalEmail(
    @Body() transactionalEmailRequestDto: TransactionalEmailRequestDto,
  ): Promise<void> {
    try {
      await this._commandBus.execute(
        new SendTransactionalEmailCommand(
          transactionalEmailRequestDto.templateName,
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
