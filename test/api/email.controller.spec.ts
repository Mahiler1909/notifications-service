import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from '../../src/presentation/api/email.controller';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { TransactionalEmailRequestDto } from '../../src/presentation/api/dto/transactional-email-request.dto';
import { NotFoundException } from '../../src/application/shared/exceptions/not-found.exception';
import { NotFoundException as HttpNotFoundException } from '@nestjs/common';
import { Receiver } from '../../src/domain/email/models/receiver.model';

describe('EmailController', () => {
  let sut: EmailController;
  let commandBus: CommandBus;

  const templateName = 'tp-customer-welcome';

  const transactionalEmailRequestDto = new TransactionalEmailRequestDto();
  transactionalEmailRequestDto.templateName = templateName;
  transactionalEmailRequestDto.parameters = { NAME: 'Name' };
  transactionalEmailRequestDto.receivers = [
    new Receiver('name@domain.co', 'Name'),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      imports: [CqrsModule],
    }).compile();

    sut = module.get<EmailController>(EmailController);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should not throw when sendTransactionalEmail succeeds', async () => {
    // Arrange
    const commandBusExecute = jest.spyOn(commandBus, 'execute');
    commandBusExecute.mockResolvedValue(undefined);

    // Act & Assert
    await expect(
      sut.sendTransactionalEmail(transactionalEmailRequestDto),
    ).resolves.toBeUndefined();
    expect(commandBusExecute).toHaveBeenCalledWith({
      parameters: transactionalEmailRequestDto.parameters,
      receivers: transactionalEmailRequestDto.receivers,
      templateName,
    });
  });

  it('should throw HttpNotFoundException when template is not found', async () => {
    // Arrange
    const commandBusExecute = jest.spyOn(commandBus, 'execute');
    commandBusExecute.mockRejectedValue(
      new NotFoundException(
        `No existe el template: ${templateName}`,
      ),
    );

    // Act
    const currentResult = async (): Promise<void> => {
      await sut.sendTransactionalEmail(transactionalEmailRequestDto);
    };

    // Assert
    await expect(currentResult).rejects.toThrow(HttpNotFoundException);
    expect(commandBusExecute).toHaveBeenCalled();
  });

  it('should re-throw unknown exceptions', async () => {
    // Arrange
    const commandBusExecute = jest.spyOn(commandBus, 'execute');
    const error = new Error('unexpected');
    commandBusExecute.mockRejectedValue(error);

    // Act
    const currentResult = async (): Promise<void> => {
      await sut.sendTransactionalEmail(transactionalEmailRequestDto);
    };

    // Assert
    await expect(currentResult).rejects.toThrow(error);
    expect(commandBusExecute).toHaveBeenCalled();
  });
});
