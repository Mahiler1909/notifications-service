import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationDto {
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public body: string;

  @IsOptional()
  @IsUrl()
  public imageUrl: string | null;

  @IsOptional()
  @IsObject()
  public payload: Record<string, string>;
}

export class PushNotificationRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public deviceTokens: Array<string>;

  @ValidateNested()
  @Type(() => NotificationDto)
  public notification: NotificationDto;
}
