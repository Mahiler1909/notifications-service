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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NotificationDto {
  @ApiProperty({ example: 'New promotion!' })
  @IsString()
  @IsNotEmpty()
  public title: string;

  @ApiProperty({ example: '50% off on all products' })
  @IsString()
  @IsNotEmpty()
  public body: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.png',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  public imageUrl: string | null;

  @ApiPropertyOptional({
    example: { orderId: '123', screen: 'promo' },
    description: 'Custom data payload sent to the device',
  })
  @IsOptional()
  @IsObject()
  public payload: Record<string, string>;
}

export class PushNotificationRequestDto {
  @ApiProperty({
    example: ['fcm-token-abc123', 'fcm-token-def456'],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public deviceTokens: Array<string>;

  @ApiProperty({ type: NotificationDto })
  @ValidateNested()
  @Type(() => NotificationDto)
  public notification: NotificationDto;
}
