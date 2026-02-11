import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiverDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public name: string;
}

export class TransactionalEmailRequestDto {
  @IsObject()
  public parameters: Record<string, unknown>;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiverDto)
  public receivers: Array<ReceiverDto>;
}
