import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiverDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  public email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  public name: string;
}

export class TransactionalEmailRequestDto {
  @ApiProperty({
    example: 'tp-customer-welcome',
    description: 'Name of the email template to use',
  })
  @IsString()
  @IsNotEmpty()
  public templateName: string;

  @ApiProperty({
    example: { NAME: 'Ferreteria Test' },
    description: 'Template parameters as key-value pairs',
    required: false,
  })
  @IsOptional()
  @IsObject()
  public parameters?: Record<string, unknown>;

  @ApiProperty({ type: [ReceiverDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiverDto)
  public receivers: Array<ReceiverDto>;
}
