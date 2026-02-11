import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailProviderOptions {
  constructor(private _configService: ConfigService) {}

  get apiKey(): string {
    const key =
      this._configService.get<string>('EMAIL_API_KEY') ??
      this._configService.get<string>('providers.email.apiKey');
    if (!key) {
      throw new Error('Missing email API key configuration (EMAIL_API_KEY)');
    }
    return key;
  }
}
